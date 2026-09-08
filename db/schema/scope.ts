import { sql } from "drizzle-orm"
import {
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core"

export const scopes = pgTable(
    "scopes",
    {
        id: varchar("id", { length: 26 }).primaryKey(),
        name: varchar("name", { length: 255 }).notNull(),
        description: varchar("description", { length: 255 }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: "date" })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        deletedAt: timestamp("deleted_at", { mode: "date" }),
    },
    (t) => [
        index("scopes_created_at_idx").on(t.createdAt),
        uniqueIndex("scopes_active_name_unique")
            .on(t.name)
            .where(sql`${t.deletedAt} IS NULL`),
    ],
)

export type Scope = typeof scopes.$inferSelect
export type NewScope = typeof scopes.$inferInsert
