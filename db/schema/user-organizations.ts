import { relations } from "drizzle-orm"
import {
	index,
	primaryKey,
	timestamp,
	varchar,
	pgTable,
} from "drizzle-orm/pg-core"

import { users } from "./user"
import { organizations } from "./organization"

export const userOrganizations = pgTable(
	"user_organizations",
	{
		userId: varchar("user_id", { length: 26 })
			.notNull()
			.references(() => users.id),
		organizationId: varchar("organization_id", { length: 26 })
			.notNull()
			.references(() => organizations.id),
		role: varchar("role", {
			length: 20,
			enum: ["owner", "admin", "member"],
		})
			.default("member")
			.notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
			() => new Date(),
		),
	},
	(t) => [
		primaryKey({ columns: [t.userId, t.organizationId] }),
		index("user_org_user_idx").on(t.userId),
		index("user_org_org_idx").on(t.organizationId),
	],
)

export type UserOrganization = typeof userOrganizations.$inferSelect
export type NewUserOrganization = typeof userOrganizations.$inferInsert

export const userOrganizationRelations = relations(
	userOrganizations,
	({ one }) => ({
		user: one(users, {
			fields: [userOrganizations.userId],
			references: [users.id],
		}),
		organization: one(organizations, {
			fields: [userOrganizations.organizationId],
			references: [organizations.id],
		}),
	}),
)
