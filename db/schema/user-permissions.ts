import { relations, sql } from "drizzle-orm"
import {
    boolean,
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core"
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
    updatedAt: timestamp("updated_at", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
    revoked: boolean("revoked").default(false).notNull(),
}, (t) => [
    index("user_permissions_user_idx").on(t.userId),
    index("user_permissions_permission_idx").on(t.permissionId),
    uniqueIndex("user_permissions_active_unique")
        .on(t.userId, t.permissionId)
        .where(sql`${t.revoked} = false`),
])

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
