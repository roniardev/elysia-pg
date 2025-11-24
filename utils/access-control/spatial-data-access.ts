import { eq, and, or, inArray } from "drizzle-orm"
import { db } from "@/db"
import { users, spatialData, userOrganizations } from "@/db/schema"
import { getAncestorOrganizations, getDescendantOrganizations } from "@/utils/organization/hierarchy"
import { logSuperadminAction } from "@/utils/superadmin/audit-logger"

export interface AccessCheckResult {
	allowed: boolean
	reason?: string
	bypassUsed?: boolean
}

export type AccessAction = "read" | "update" | "delete" | "approve" | "bypass_workflow"

async function checkSuperadminAccess(
	userId: string,
	action: AccessAction,
	resourceId: string,
): Promise<boolean> {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	})

	if (!user) {
		return false
	}

	if (!user.isSuperadmin) {
		return false
	}

	await logSuperadminAction({
		userId,
		action: `superadmin_access_${action}`,
		resourceType: "spatial_data",
		resourceId,
		bypassedRestrictions: ["organization_isolation", "visibility_control", "approval_workflow"],
	})

	return true
}

async function getUserOrganizationIds(userId: string): Promise<string[]> {
	const userOrgs = await db.query.userOrganizations.findMany({
		where: eq(userOrganizations.userId, userId),
	})

	return userOrgs.map((uo) => uo.organizationId)
}

async function checkOwnership(userId: string, dataUserId: string): Promise<boolean> {
	return userId === dataUserId
}

async function checkPublicAccess(visibility: string, action: AccessAction): Promise<boolean> {
	if (visibility !== "public") {
		return false
	}

	if (action === "read") {
		return true
	}

	return false
}

async function checkPrivateAccess(
	userId: string,
	dataUserId: string,
	visibility: string,
): Promise<boolean> {
	if (visibility !== "private") {
		return false
	}

	return userId === dataUserId
}

async function checkOrganizationAccess(
	userOrgIds: string[],
	dataOrgId: string,
	visibility: string,
): Promise<boolean> {
	if (visibility !== "organization") {
		return false
	}

	return userOrgIds.includes(dataOrgId)
}

async function checkOrganizationTreeAccess(
	userOrgIds: string[],
	dataOrgId: string,
	visibility: string,
): Promise<boolean> {
	if (visibility !== "organization_tree") {
		return false
	}

	const treeOrgIds = await getDescendantOrganizations(dataOrgId)

	for (const userOrgId of userOrgIds) {
		if (treeOrgIds.includes(userOrgId)) {
			return true
		}
	}

	return false
}

async function checkOrganizationParentAccess(
	userOrgIds: string[],
	dataOrgId: string,
	visibility: string,
): Promise<boolean> {
	if (visibility !== "organization_parent") {
		return false
	}

	const ancestors = await getAncestorOrganizations(dataOrgId)

	for (const userOrgId of userOrgIds) {
		if (ancestors.includes(userOrgId) || userOrgId === dataOrgId) {
			return true
		}
	}

	return false
}

async function checkApprovalStatusAccess(
	userId: string,
	approvalStatus: string,
	makerId: string | null,
	checkerId: string | null,
	signerId: string | null,
	dataOrgId: string,
): Promise<boolean> {
	if (approvalStatus === "approved") {
		return true
	}

	const isInWorkflow =
		userId === makerId || userId === checkerId || userId === signerId

	if (isInWorkflow) {
		return true
	}

	const userOrgs = await db.query.userOrganizations.findMany({
		where: and(
			eq(userOrganizations.userId, userId),
			eq(userOrganizations.organizationId, dataOrgId),
		),
	})

	const isAdmin = userOrgs.some((uo) => uo.role === "admin" || uo.role === "owner")

	return isAdmin
}

export async function canAccessSpatialData(
	userId: string,
	spatialDataId: string,
	action: AccessAction,
): Promise<AccessCheckResult> {
	const isSuperadmin = await checkSuperadminAccess(userId, action, spatialDataId)

	if (isSuperadmin) {
		return {
			allowed: true,
			bypassUsed: true,
			reason: "Superadmin access granted",
		}
	}

	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, spatialDataId),
	})

	if (!data) {
		return { allowed: false, reason: "Data not found" }
	}

	const isOwner = await checkOwnership(userId, data.userId)

	if (isOwner && data.visibility === "private") {
		return { allowed: true, reason: "Owner access" }
	}

	const isPublic = await checkPublicAccess(data.visibility, action)

	if (isPublic) {
		return { allowed: true, reason: "Public access" }
	}

	const isPrivate = await checkPrivateAccess(userId, data.userId, data.visibility)

	if (isPrivate) {
		return { allowed: true, reason: "Private owner access" }
	}

	const userOrgIds = await getUserOrganizationIds(userId)

	const isOrgAccess = await checkOrganizationAccess(
		userOrgIds,
		data.organizationId,
		data.visibility,
	)

	if (isOrgAccess) {
		const canViewApprovalStatus = await checkApprovalStatusAccess(
			userId,
			data.approvalStatus,
			data.makerId,
			data.checkerId,
			data.signerId,
			data.organizationId,
		)

		if (!canViewApprovalStatus) {
			return { allowed: false, reason: "Data not yet approved" }
		}

		return { allowed: true, reason: "Organization access" }
	}

	const isTreeAccess = await checkOrganizationTreeAccess(
		userOrgIds,
		data.organizationId,
		data.visibility,
	)

	if (isTreeAccess) {
		const canViewApprovalStatus = await checkApprovalStatusAccess(
			userId,
			data.approvalStatus,
			data.makerId,
			data.checkerId,
			data.signerId,
			data.organizationId,
		)

		if (!canViewApprovalStatus) {
			return { allowed: false, reason: "Data not yet approved" }
		}

		return { allowed: true, reason: "Organization tree access" }
	}

	const isParentAccess = await checkOrganizationParentAccess(
		userOrgIds,
		data.organizationId,
		data.visibility,
	)

	if (isParentAccess) {
		const canViewApprovalStatus = await checkApprovalStatusAccess(
			userId,
			data.approvalStatus,
			data.makerId,
			data.checkerId,
			data.signerId,
			data.organizationId,
		)

		if (!canViewApprovalStatus) {
			return { allowed: false, reason: "Data not yet approved" }
		}

		return { allowed: true, reason: "Organization parent access" }
	}

	return { allowed: false, reason: "Access denied" }
}
