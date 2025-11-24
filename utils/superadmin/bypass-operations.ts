import { eq } from "drizzle-orm"
import { db } from "@/db"
import { spatialData, spatialDataApprovals, users } from "@/db/schema"
import { ulid } from "ulid"
import { logSuperadminAction } from "./audit-logger"

export interface SuperadminOperationResult {
	success: boolean
	message: string
}

async function checkIsSuperadmin(userId: string): Promise<boolean> {
	const user = await db.query.users.findFirst({
		where: eq(users.id, userId),
	})

	if (!user) {
		return false
	}

	return user.isSuperadmin
}

export async function superadminForceApprove(
	spatialDataId: string,
	superadminId: string,
	justification: string,
): Promise<SuperadminOperationResult> {
	const isSuperadmin = await checkIsSuperadmin(superadminId)

	if (!isSuperadmin) {
		return { success: false, message: "User is not a superadmin" }
	}

	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, spatialDataId),
	})

	if (!data) {
		return { success: false, message: "Data not found" }
	}

	const dataBefore = { ...data }

	await db
		.update(spatialData)
		.set({
			approvalStatus: "approved",
			signerId: superadminId,
			signedAt: new Date(),
			approvedAt: new Date(),
		})
		.where(eq(spatialData.id, spatialDataId))

	await db.insert(spatialDataApprovals).values({
		id: ulid(),
		spatialDataId,
		action: "superadmin_force_approve",
		performedBy: superadminId,
		fromStatus: data.approvalStatus,
		toStatus: "approved",
		comments: `🚨 SUPERADMIN BYPASS: ${justification}`,
	})

	await logSuperadminAction({
		userId: superadminId,
		action: "superadmin_force_approve",
		resourceType: "spatial_data",
		resourceId: spatialDataId,
		bypassedRestrictions: ["cms_workflow", "4_eyes_principle", "segregation_of_duties"],
		dataBefore,
		dataAfter: { approvalStatus: "approved", signerId: superadminId },
		justification,
	})

	return { success: true, message: "Data force-approved by superadmin" }
}

export async function grantSuperadmin(
	targetUserId: string,
	grantedBy: string,
	justification: string,
): Promise<SuperadminOperationResult> {
	const grantor = await db.query.users.findFirst({
		where: eq(users.id, grantedBy),
	})

	if (!grantor) {
		return { success: false, message: "Grantor not found" }
	}

	if (!grantor.isSuperadmin) {
		return { success: false, message: "Only superadmin can grant superadmin access" }
	}

	const targetUser = await db.query.users.findFirst({
		where: eq(users.id, targetUserId),
	})

	if (!targetUser) {
		return { success: false, message: "Target user not found" }
	}

	if (targetUser.isSuperadmin) {
		return { success: false, message: "User is already a superadmin" }
	}

	await db
		.update(users)
		.set({
			isSuperadmin: true,
			superadminGrantedAt: new Date(),
			superadminGrantedBy: grantedBy,
		})
		.where(eq(users.id, targetUserId))

	await logSuperadminAction({
		userId: grantedBy,
		action: "grant_superadmin",
		resourceType: "user",
		resourceId: targetUserId,
		bypassedRestrictions: [],
		justification,
	})

	return { success: true, message: "Superadmin access granted" }
}

export async function revokeSuperadmin(
	targetUserId: string,
	revokedBy: string,
	justification: string,
): Promise<SuperadminOperationResult> {
	const revoker = await db.query.users.findFirst({
		where: eq(users.id, revokedBy),
	})

	if (!revoker) {
		return { success: false, message: "Revoker not found" }
	}

	if (!revoker.isSuperadmin) {
		return { success: false, message: "Only superadmin can revoke superadmin access" }
	}

	const targetUser = await db.query.users.findFirst({
		where: eq(users.id, targetUserId),
	})

	if (!targetUser) {
		return { success: false, message: "Target user not found" }
	}

	if (!targetUser.isSuperadmin) {
		return { success: false, message: "User is not a superadmin" }
	}

	if (targetUserId === revokedBy) {
		return { success: false, message: "Cannot revoke your own superadmin access" }
	}

	await db
		.update(users)
		.set({
			isSuperadmin: false,
			superadminGrantedAt: null,
			superadminGrantedBy: null,
		})
		.where(eq(users.id, targetUserId))

	await logSuperadminAction({
		userId: revokedBy,
		action: "revoke_superadmin",
		resourceType: "user",
		resourceId: targetUserId,
		bypassedRestrictions: [],
		justification,
	})

	return { success: true, message: "Superadmin access revoked" }
}
