import {
	pgTable,
	varchar,
	primaryKey,
	timestamp,
	boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { scopes } from "./scope";
import { userPermissions } from "./user-permissions";

export const scopeUserPermissions = pgTable("scope_user_permissions", {
	id: varchar("id", { length: 26 }).primaryKey(),
	scopeId: varchar("scope_id", { length: 26 })
		.notNull()
		.references(() => scopes.id),
	userPermissionId: varchar("user_permission_id", { length: 26 })
		.notNull()
		.references(() => userPermissions.id),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
		() => new Date(),
	),
	revoked: boolean("revoked").default(false).notNull(),
});

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
);
