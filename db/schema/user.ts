import { relations } from "drizzle-orm"
import {
	boolean,
	index,
	timestamp,
	varchar,
	pgTable,
} from "drizzle-orm/pg-core"

import { userPermissions } from "./user-permissions"
import { userOrganizations } from "./user-organizations"

export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 26 }).primaryKey(),
		email: varchar("email", { length: 255 }).unique().notNull(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		hashedPassword: varchar("hashed_password", { length: 255 }),
		photo: varchar("photo", { length: 255 }),
		isSuperadmin: boolean("is_superadmin").default(false).notNull(),
		superadminGrantedAt: timestamp("superadmin_granted_at", { mode: "date" }),
		superadminGrantedBy: varchar("superadmin_granted_by", { length: 26 })
			.references(() => users.id),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
			() => new Date(),
		),
		deletedAt: timestamp("deleted_at", { mode: "date" }),
	},
	(t) => [
		index("user_email_idx").on(t.email),
		index("users_is_superadmin_idx").on(t.isSuperadmin),
	],
)

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert

export const userRelations = relations(users, ({ many }) => ({
	permissions: many(userPermissions),
	organizations: many(userOrganizations),
}))