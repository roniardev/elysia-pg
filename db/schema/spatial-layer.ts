import { relations } from "drizzle-orm"
import {
	index,
	text,
	timestamp,
	varchar,
	pgTable,
	jsonb,
	integer,
} from "drizzle-orm/pg-core"

import { users } from "./user"
import { organizations } from "./organization"
import { spatialMaps } from "./spatial-map"

export const spatialLayers = pgTable(
	"spatial_layers",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		userId: varchar("user_id", { length: 26 })
			.notNull()
			.references(() => users.id),
		organizationId: varchar("organization_id", { length: 26 })
			.notNull()
			.references(() => organizations.id),
		mapId: varchar("map_id", { length: 26 })
			.references(() => spatialMaps.id),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		layerType: varchar("layer_type", {
			length: 20,
			enum: ["vector", "raster", "tile"],
		})
			.default("vector")
			.notNull(),
		style: jsonb("style"), // Store layer styling options
		minZoom: integer("min_zoom").default(0),
		maxZoom: integer("max_zoom").default(22),
		opacity: integer("opacity").default(100), // 0-100
		isVisible: varchar("is_visible", {
			length: 12,
			enum: ["true", "false"],
		})
			.default("true")
			.notNull(),
		zIndex: integer("z_index").default(0), // Layer ordering
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
		index("spatial_layer_user_idx").on(t.userId),
		index("spatial_layer_org_idx").on(t.organizationId),
		index("spatial_layer_map_idx").on(t.mapId),
		index("spatial_layer_created_at_idx").on(t.createdAt),
		index("spatial_layers_approval_status_idx").on(t.approvalStatus),
	],
)

export type SpatialLayer = typeof spatialLayers.$inferSelect
export type NewSpatialLayer = typeof spatialLayers.$inferInsert

export const spatialLayerRelations = relations(spatialLayers, ({ one }) => ({
	user: one(users, {
		fields: [spatialLayers.userId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [spatialLayers.organizationId],
		references: [organizations.id],
	}),
	map: one(spatialMaps, {
		fields: [spatialLayers.mapId],
		references: [spatialMaps.id],
	}),
}))
