import {
	pgTable,
	varchar,
	primaryKey,
	timestamp,
	boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./user";
import { permissions } from "./permission";

export const userPermissions = pgTable(
	"user_permissions",
	{
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
	},
	(table) => [
		primaryKey({
			columns: [table.userId, table.permissionId],
		}),
	],
);

export const userPermissionsRelations = relations(
	userPermissions,
	({ one }) => ({
		user: one(users, {
			fields: [userPermissions.userId],
			references: [users.id],
		}),
		permission: one(permissions, {
			fields: [userPermissions.permissionId],
			references: [permissions.id],
		}),
	}),
);
