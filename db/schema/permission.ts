import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const permissions = pgTable("permissions", {
	id: varchar("id", { length: 26 }).primaryKey(),
	name: varchar("name", { length: 255 }).notNull(),
	description: varchar("description", { length: 255 }),
	createdAt: timestamp("created_at").defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
		() => new Date(),
	),
	deletedAt: timestamp("deleted_at", { mode: "date" }),
});

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
