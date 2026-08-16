import { relations } from "drizzle-orm"
import { boolean, pgTable, timestamp, varchar } from "drizzle-orm/pg-core"
import { permissions } from "@/db/schema/permission"
import { scopeUserPermissions } from "@/db/schema/scope-user-permissions"
import { users } from "@/db/schema/user"

export const userPermissions = pgTable("user_permissions", {
    id: varchar("id", { length: 26 }).primaryKey(),
    userId: varchar("user_id", { length: 26 })
        .notNull()
        .references(() => users.id),
    permissionId: varchar("permission_id", { length: 26 })
        .notNull()
        .references(() => permissions.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
        () => new Date(),
    ),
    revoked: boolean("revoked").default(false).notNull(),
})

export const userPermissionsRelations = relations(
    userPermissions,
    ({ one, many }) => ({
        user: one(users, {
            fields: [userPermissions.userId],
            references: [users.id],
        }),
        permission: one(permissions, {
            fields: [userPermissions.permissionId],
            references: [permissions.id],
        }),
        scopeUserPermissions: many(scopeUserPermissions),
    }),
)

export type UserPermission = typeof userPermissions.$inferSelect
export type NewUserPermission = typeof userPermissions.$inferInsert
