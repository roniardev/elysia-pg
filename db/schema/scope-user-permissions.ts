import { relations, sql } from "drizzle-orm"
import {
    boolean,
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core"

import { scopes } from "@/db/schema/scope"
import { userPermissions } from "@/db/schema/user-permissions"

export const scopeUserPermissions = pgTable("scope_user_permissions", {
    id: varchar("id", { length: 26 }).primaryKey(),
    scopeId: varchar("scope_id", { length: 26 })
        .notNull()
        .references(() => scopes.id),
    userPermissionId: varchar("user_permission_id", { length: 26 })
        .notNull()
        .references(() => userPermissions.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" })
        .defaultNow()
        .$onUpdate(() => new Date())
        .notNull(),
    revoked: boolean("revoked").default(false).notNull(),
}, (t) => [
    index("scope_user_permissions_scope_idx").on(t.scopeId),
    index("scope_user_permissions_assignment_idx").on(t.userPermissionId),
    uniqueIndex("scope_user_permissions_active_unique")
        .on(t.scopeId, t.userPermissionId)
        .where(sql`${t.revoked} = false`),
])

export const scopeUserPermissionsRelations = relations(
    scopeUserPermissions,
    ({ one }) => ({
        scope: one(scopes, {
            fields: [scopeUserPermissions.scopeId],
            references: [scopes.id],
        }),
        userPermissions: one(userPermissions, {
            fields: [scopeUserPermissions.userPermissionId],
            references: [userPermissions.id],
        }),
    }),
)
