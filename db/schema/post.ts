import { relations, sql } from "drizzle-orm"
import {
    check,
    index,
    pgTable,
    text,
    timestamp,
    varchar,
} from "drizzle-orm/pg-core"

import { users } from "@/db/schema/user"

export const posts = pgTable(
    "posts",
    {
        id: varchar("id", { length: 26 }).primaryKey(),
        userId: varchar("user_id", { length: 26 })
            .notNull()
            .references(() => users.id),
        title: varchar("title", { length: 255 }).notNull(),
        excerpt: varchar("excerpt", { length: 255 }).notNull(),
        content: text("content").notNull(),
        status: varchar("status", { length: 10, enum: ["draft", "published"] })
            .default("draft")
            .notNull(),
        visibility: varchar("visibility", {
            length: 10,
            enum: ["public", "private"],
        })
            .default("private")
            .notNull(),
        tags: varchar("tags", { length: 255 }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: "date" })
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
        deletedAt: timestamp("deleted_at", { mode: "date" }),
    },
    (t) => [
        index("post_user_idx").on(t.userId),
        index("posts_active_user_created_at_idx")
            .on(t.userId, t.createdAt, t.id)
            .where(sql`${t.deletedAt} IS NULL`),
        index("posts_active_created_at_idx")
            .on(t.createdAt, t.id)
            .where(sql`${t.deletedAt} IS NULL`),
        check(
            "posts_status_check",
            sql`${t.status} IN ('draft', 'published')`,
        ),
        check(
            "posts_visibility_check",
            sql`${t.visibility} IN ('public', 'private')`,
        ),
    ],
)

export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert

export const postRelations = relations(posts, ({ one }) => ({
    user: one(users, {
        fields: [posts.userId],
        references: [users.id],
    }),
}))
