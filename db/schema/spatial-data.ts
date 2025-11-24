import { relations } from "drizzle-orm"
import {
	index,
	text,
	timestamp,
	varchar,
	pgTable,
	jsonb,
} from "drizzle-orm/pg-core"
import { customType } from "drizzle-orm/pg-core"

import { users } from "./user"
import { organizations } from "./organization"
import { spatialLayers } from "./spatial-layer"

// Custom geometry type for PostGIS
const geometry = customType<{ data: string; notNull: false; default: false }>({
	dataType() {
		return "geometry(Point, 4326)"
	},
})

export const spatialData = pgTable(
	"spatial_data",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		userId: varchar("user_id", { length: 26 })
			.notNull()
			.references(() => users.id),
		organizationId: varchar("organization_id", { length: 26 })
			.notNull()
			.references(() => organizations.id),
		layerId: varchar("layer_id", { length: 26 })
			.references(() => spatialLayers.id),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		geometry: geometry("geometry").notNull(),
		properties: jsonb("properties"), // Store additional GeoJSON properties
		dataType: varchar("data_type", {
			length: 20,
			enum: ["point", "line", "polygon", "multipoint", "multiline", "multipolygon"],
		})
			.default("point")
			.notNull(),
		status: varchar("status", {
			length: 12,
			enum: ["active", "inactive"],
		})
			.default("active")
			.notNull(),
		visibility: varchar("visibility", {
			length: 20,
			enum: ["public", "private", "organization", "organization_tree", "organization_parent"],
		})
			.default("private")
			.notNull(),
		tags: varchar("tags", { length: 255 }),
		approvalStatus: varchar("approval_status", {
			length: 20,
			enum: ["draft", "pending_check", "pending_sign", "approved", "rejected", "revision"],
		})
			.default("draft")
			.notNull(),
		makerId: varchar("maker_id", { length: 26 })
			.references(() => users.id),
		checkerId: varchar("checker_id", { length: 26 })
			.references(() => users.id),
		signerId: varchar("signer_id", { length: 26 })
			.references(() => users.id),
		checkedAt: timestamp("checked_at", { mode: "date" }),
		signedAt: timestamp("signed_at", { mode: "date" }),
		approvedAt: timestamp("approved_at", { mode: "date" }),
		rejectionReason: text("rejection_reason"),
		rejectedBy: varchar("rejected_by", { length: 26 })
			.references(() => users.id),
		rejectedAt: timestamp("rejected_at", { mode: "date" }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
			() => new Date(),
		),
		deletedAt: timestamp("deleted_at", { mode: "date" }),
	},
	(t) => [
		index("spatial_data_user_idx").on(t.userId),
		index("spatial_data_org_idx").on(t.organizationId),
		index("spatial_data_layer_idx").on(t.layerId),
		index("spatial_data_created_at_idx").on(t.createdAt),
		index("spatial_data_approval_status_idx").on(t.approvalStatus),
		index("spatial_data_maker_idx").on(t.makerId),
		index("spatial_data_checker_idx").on(t.checkerId),
		index("spatial_data_signer_idx").on(t.signerId),
		// PostGIS spatial index (will be created via migration)
		// CREATE INDEX spatial_data_geom_idx ON spatial_data USING GIST (geometry);
	],
)

export type SpatialData = typeof spatialData.$inferSelect
export type NewSpatialData = typeof spatialData.$inferInsert

export const spatialDataRelations = relations(spatialData, ({ one }) => ({
	user: one(users, {
		fields: [spatialData.userId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [spatialData.organizationId],
		references: [organizations.id],
	}),
	layer: one(spatialLayers, {
		fields: [spatialData.layerId],
		references: [spatialLayers.id],
	}),
}))
