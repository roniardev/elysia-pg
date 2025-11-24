import { relations } from "drizzle-orm"
import {
	index,
	text,
	timestamp,
	varchar,
	pgTable,
	jsonb,
} from "drizzle-orm/pg-core"

import { users } from "./user"

export const superadminAuditLogs = pgTable(
	"superadmin_audit_logs",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		userId: varchar("user_id", { length: 26 })
			.notNull()
			.references(() => users.id, { onDelete: "set null" }),
		performedAt: timestamp("performed_at").defaultNow().notNull(),
		action: varchar("action", { length: 100 }).notNull(),
		resourceType: varchar("resource_type", { length: 50 }).notNull(),
		resourceId: varchar("resource_id", { length: 26 }).notNull(),
		bypassedRestrictions: jsonb("bypassed_restrictions").$type<string[]>(),
		ipAddress: varchar("ip_address", { length: 45 }),
		userAgent: text("user_agent"),
		requestMetadata: jsonb("request_metadata"),
		dataBefore: jsonb("data_before"),
		dataAfter: jsonb("data_after"),
		justification: text("justification"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("superadmin_audit_user_idx").on(t.userId),
		index("superadmin_audit_resource_idx").on(t.resourceType, t.resourceId),
		index("superadmin_audit_time_idx").on(t.performedAt),
		index("superadmin_audit_action_idx").on(t.action),
	],
)

export type SuperadminAuditLog = typeof superadminAuditLogs.$inferSelect
export type NewSuperadminAuditLog = typeof superadminAuditLogs.$inferInsert

export const superadminAuditLogRelations = relations(superadminAuditLogs, ({ one }) => ({
	user: one(users, {
		fields: [superadminAuditLogs.userId],
		references: [users.id],
	}),
}))
