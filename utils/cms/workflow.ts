import { eq } from "drizzle-orm"
import { db } from "@/db"
import { spatialData, spatialDataApprovals } from "@/db/schema"
import { ulid } from "ulid"
import { verifyPermission } from "@/common/verify-permission"

export interface WorkflowResult {
	success: boolean
	message: string
}

async function checkIsMaker(dataId: string, userId: string): Promise<boolean> {
	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, dataId),
	})

	if (!data) {
		return false
	}

	return data.makerId === userId
}

async function checkIsChecker(dataId: string, userId: string): Promise<boolean> {
	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, dataId),
	})

	if (!data) {
		return false
	}

	return data.checkerId === userId
}

async function checkCurrentStatus(dataId: string, expectedStatus: string): Promise<boolean> {
	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, dataId),
	})

	if (!data) {
		return false
	}

	return data.approvalStatus === expectedStatus
}

async function logApprovalAction(params: {
	spatialDataId: string
	action: string
	performedBy: string
	fromStatus: string
	toStatus: string
	comments?: string
}): Promise<void> {
	await db.insert(spatialDataApprovals).values({
		id: ulid(),
		spatialDataId: params.spatialDataId,
		action: params.action,
		performedBy: params.performedBy,
		fromStatus: params.fromStatus,
		toStatus: params.toStatus,
		comments: params.comments,
	})
}

export async function submitForCheck(
	spatialDataId: string,
	userId: string,
): Promise<WorkflowResult> {
	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, spatialDataId),
	})

	if (!data) {
		return { success: false, message: "Data not found" }
	}

	const isMaker = data.makerId === userId

	if (!isMaker) {
		return { success: false, message: "Only maker can submit for check" }
	}

	const isDraft = data.approvalStatus === "draft"

	if (!isDraft) {
		return { success: false, message: "Data must be in draft status" }
	}

	await db
		.update(spatialData)
		.set({ approvalStatus: "pending_check" })
		.where(eq(spatialData.id, spatialDataId))

	await logApprovalAction({
		spatialDataId,
		action: "submit",
		performedBy: userId,
		fromStatus: "draft",
		toStatus: "pending_check",
	})

	return { success: true, message: "Submitted for check" }
}

export async function checkData(
	spatialDataId: string,
	checkerId: string,
	approved: boolean,
	comments?: string,
): Promise<WorkflowResult> {
	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, spatialDataId),
	})

	if (!data) {
		return { success: false, message: "Data not found" }
	}

	const hasPermission = await verifyPermission("check:spatial-data", checkerId)

	if (!hasPermission.valid) {
		return { success: false, message: "No permission to check" }
	}

	const isNotMaker = data.makerId !== checkerId

	if (!isNotMaker) {
		return {
			success: false,
			message: "Checker cannot be the maker (4-eyes principle)",
		}
	}

	const isPendingCheck = data.approvalStatus === "pending_check"

	if (!isPendingCheck) {
		return { success: false, message: "Data not in pending_check status" }
	}

	if (approved) {
		await db
			.update(spatialData)
			.set({
				approvalStatus: "pending_sign",
				checkerId,
				checkedAt: new Date(),
			})
			.where(eq(spatialData.id, spatialDataId))

		await logApprovalAction({
			spatialDataId,
			action: "check",
			performedBy: checkerId,
			fromStatus: "pending_check",
			toStatus: "pending_sign",
			comments,
		})

		return { success: true, message: "Data checked and forwarded for signing" }
	}

	await db
		.update(spatialData)
		.set({
			approvalStatus: "revision",
			rejectedBy: checkerId,
			rejectedAt: new Date(),
			rejectionReason: comments,
		})
		.where(eq(spatialData.id, spatialDataId))

	await logApprovalAction({
		spatialDataId,
		action: "reject",
		performedBy: checkerId,
		fromStatus: "pending_check",
		toStatus: "revision",
		comments,
	})

	return { success: true, message: "Data rejected for revision" }
}

export async function signData(
	spatialDataId: string,
	signerId: string,
	approved: boolean,
	comments?: string,
): Promise<WorkflowResult> {
	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, spatialDataId),
	})

	if (!data) {
		return { success: false, message: "Data not found" }
	}

	const hasPermission = await verifyPermission("sign:spatial-data", signerId)

	if (!hasPermission.valid) {
		return { success: false, message: "No permission to sign" }
	}

	const isNotMakerOrChecker = data.makerId !== signerId && data.checkerId !== signerId

	if (!isNotMakerOrChecker) {
		return {
			success: false,
			message: "Signer cannot be maker or checker (segregation of duties)",
		}
	}

	const isPendingSign = data.approvalStatus === "pending_sign"

	if (!isPendingSign) {
		return { success: false, message: "Data not in pending_sign status" }
	}

	if (approved) {
		await db
			.update(spatialData)
			.set({
				approvalStatus: "approved",
				signerId,
				signedAt: new Date(),
				approvedAt: new Date(),
			})
			.where(eq(spatialData.id, spatialDataId))

		await logApprovalAction({
			spatialDataId,
			action: "sign",
			performedBy: signerId,
			fromStatus: "pending_sign",
			toStatus: "approved",
			comments,
		})

		return { success: true, message: "Data signed and approved" }
	}

	await db
		.update(spatialData)
		.set({
			approvalStatus: "rejected",
			rejectedBy: signerId,
			rejectedAt: new Date(),
			rejectionReason: comments,
		})
		.where(eq(spatialData.id, spatialDataId))

	await logApprovalAction({
		spatialDataId,
		action: "reject",
		performedBy: signerId,
		fromStatus: "pending_sign",
		toStatus: "rejected",
		comments,
	})

	return { success: true, message: "Data rejected" }
}

export async function reviseData(
	spatialDataId: string,
	userId: string,
): Promise<WorkflowResult> {
	const data = await db.query.spatialData.findFirst({
		where: eq(spatialData.id, spatialDataId),
	})

	if (!data) {
		return { success: false, message: "Data not found" }
	}

	const isMaker = data.makerId === userId

	if (!isMaker) {
		return { success: false, message: "Only maker can revise data" }
	}

	const isRevision = data.approvalStatus === "revision"

	if (!isRevision) {
		return { success: false, message: "Data not in revision status" }
	}

	await db
		.update(spatialData)
		.set({
			approvalStatus: "draft",
			rejectedBy: null,
			rejectedAt: null,
			rejectionReason: null,
		})
		.where(eq(spatialData.id, spatialDataId))

	await logApprovalAction({
		spatialDataId,
		action: "revise",
		performedBy: userId,
		fromStatus: "revision",
		toStatus: "draft",
	})

	return { success: true, message: "Data moved to draft for revision" }
}
