import { relations } from "drizzle-orm"
import {
	index,
	timestamp,
	varchar,
	pgTable,
	integer,
	boolean,
} from "drizzle-orm/pg-core"

import { users } from "./user"
import { userOrganizations } from "./user-organizations"
import { posts } from "./post"

export const organizations = pgTable(
	"organizations",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		name: varchar("name", { length: 255 }).notNull(),
		slug: varchar("slug", { length: 255 }).unique().notNull(),
		ownerId: varchar("owner_id", { length: 26 })
			.notNull()
			.references(() => users.id),
		parentOrganizationId: varchar("parent_organization_id", { length: 26 })
			.references(() => organizations.id),
		organizationPath: varchar("organization_path", { length: 500 }),
		level: integer("level").default(0).notNull(),
		inheritPermissions: boolean("inherit_permissions").default(true).notNull(),
		isolatedData: boolean("isolated_data").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
			() => new Date(),
		),
		deletedAt: timestamp("deleted_at", { mode: "date" }),
	},
	(t) => [
		index("org_slug_idx").on(t.slug),
		index("org_owner_idx").on(t.ownerId),
		index("org_parent_idx").on(t.parentOrganizationId),
		index("org_path_idx").on(t.organizationPath),
		index("org_level_idx").on(t.level),
	],
)

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert

export const organizationRelations = relations(organizations, ({ one, many }) => ({
	owner: one(users, {
		fields: [organizations.ownerId],
		references: [users.id],
	}),
	parentOrganization: one(organizations, {
		fields: [organizations.parentOrganizationId],
		references: [organizations.id],
		relationName: "organizationHierarchy",
	}),
	childOrganizations: many(organizations, {
		relationName: "organizationHierarchy",
	}),
	members: many(userOrganizations),
	posts: many(posts),
}))
