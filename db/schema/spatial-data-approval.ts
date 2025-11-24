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
import { spatialData } from "./spatial-data"

export const spatialDataApprovals = pgTable(
	"spatial_data_approvals",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		spatialDataId: varchar("spatial_data_id", { length: 26 })
			.notNull()
			.references(() => spatialData.id, { onDelete: "cascade" }),
		action: varchar("action", {
			length: 20,
			enum: ["create", "update", "delete", "submit", "check", "sign", "reject", "revise", "superadmin_force_approve"],
		}).notNull(),
		performedBy: varchar("performed_by", { length: 26 })
			.notNull()
			.references(() => users.id, { onDelete: "set null" }),
		fromStatus: varchar("from_status", { length: 20 }),
		toStatus: varchar("to_status", { length: 20 }).notNull(),
		comments: text("comments"),
		metadata: jsonb("metadata"),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => [
		index("spatial_data_approvals_data_idx").on(t.spatialDataId),
		index("spatial_data_approvals_performer_idx").on(t.performedBy),
		index("spatial_data_approvals_created_idx").on(t.createdAt),
		index("spatial_data_approvals_action_idx").on(t.action),
	],
)

export type SpatialDataApproval = typeof spatialDataApprovals.$inferSelect
export type NewSpatialDataApproval = typeof spatialDataApprovals.$inferInsert

export const spatialDataApprovalRelations = relations(spatialDataApprovals, ({ one }) => ({
	spatialData: one(spatialData, {
		fields: [spatialDataApprovals.spatialDataId],
		references: [spatialData.id],
	}),
	performer: one(users, {
		fields: [spatialDataApprovals.performedBy],
		references: [users.id],
	}),
}))
