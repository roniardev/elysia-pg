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
			length: 12,
			enum: ["public", "private", "organization"],
		})
			.default("private")
			.notNull(),
		tags: varchar("tags", { length: 255 }),
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
