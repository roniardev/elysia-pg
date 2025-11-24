import { relations } from "drizzle-orm"
import {
	index,
	text,
	timestamp,
	varchar,
	pgTable,
	jsonb,
	doublePrecision,
} from "drizzle-orm/pg-core"

import { users } from "./user"
import { organizations } from "./organization"

export const spatialMaps = pgTable(
	"spatial_maps",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		userId: varchar("user_id", { length: 26 })
			.notNull()
			.references(() => users.id),
		organizationId: varchar("organization_id", { length: 26 })
			.notNull()
			.references(() => organizations.id),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		// Default map view settings
		centerLat: doublePrecision("center_lat").default(0),
		centerLng: doublePrecision("center_lng").default(0),
		defaultZoom: doublePrecision("default_zoom").default(10),
		// Map configuration
		baseMap: varchar("base_map", {
			length: 50,
			enum: ["osm", "satellite", "terrain", "dark", "light"],
		})
			.default("osm")
			.notNull(),
		projection: varchar("projection", { length: 50 }).default("EPSG:4326"),
		settings: jsonb("settings"), // Additional map settings
		status: varchar("status", {
			length: 10,
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
		index("spatial_map_user_idx").on(t.userId),
		index("spatial_map_org_idx").on(t.organizationId),
		index("spatial_map_created_at_idx").on(t.createdAt),
		index("spatial_maps_approval_status_idx").on(t.approvalStatus),
	],
)

export type SpatialMap = typeof spatialMaps.$inferSelect
export type NewSpatialMap = typeof spatialMaps.$inferInsert

export const spatialMapRelations = relations(spatialMaps, ({ one }) => ({
	user: one(users, {
		fields: [spatialMaps.userId],
		references: [users.id],
	}),
	organization: one(organizations, {
		fields: [spatialMaps.organizationId],
		references: [organizations.id],
	}),
}))
