import { relations } from "drizzle-orm"
import {
	index,
	timestamp,
	varchar,
	pgTable,
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
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
			() => new Date(),
		),
		deletedAt: timestamp("deleted_at", { mode: "date" }),
	},
	(t) => [
		index("org_slug_idx").on(t.slug),
		index("org_owner_idx").on(t.ownerId),
	],
)

export type Organization = typeof organizations.$inferSelect
export type NewOrganization = typeof organizations.$inferInsert

export const organizationRelations = relations(organizations, ({ one, many }) => ({
	owner: one(users, {
		fields: [organizations.ownerId],
		references: [users.id],
	}),
	members: many(userOrganizations),
	posts: many(posts),
}))
