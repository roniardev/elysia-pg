import { db } from "@/db"
import { superadminAuditLogs } from "@/db/schema"
import { ulid } from "ulid"

export interface LogSuperadminActionParams {
	userId: string
	action: string
	resourceType: string
	resourceId: string
	bypassedRestrictions: string[]
	dataBefore?: unknown
	dataAfter?: unknown
	justification?: string
	ipAddress?: string
	userAgent?: string
	requestMetadata?: unknown
}

export async function logSuperadminAction(params: LogSuperadminActionParams): Promise<void> {
	await db.insert(superadminAuditLogs).values({
		id: ulid(),
		userId: params.userId,
		action: params.action,
		resourceType: params.resourceType,
		resourceId: params.resourceId,
		bypassedRestrictions: params.bypassedRestrictions,
		dataBefore: params.dataBefore as Record<string, unknown> | null | undefined,
		dataAfter: params.dataAfter as Record<string, unknown> | null | undefined,
		justification: params.justification,
		ipAddress: params.ipAddress,
		userAgent: params.userAgent,
		requestMetadata: params.requestMetadata as Record<string, unknown> | null | undefined,
		performedAt: new Date(),
	})
}

export async function getSuperadminAuditLogs(params: {
	userId?: string
	action?: string
	resourceType?: string
	resourceId?: string
	startDate?: Date
	endDate?: Date
	limit?: number
	offset?: number
}) {
	let query = db.select().from(superadminAuditLogs)

	const logs = await query.limit(params.limit || 100).offset(params.offset || 0)

	return logs
}
