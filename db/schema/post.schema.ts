import { relations } from "drizzle-orm";
import { index, text, timestamp, varchar, pgTable } from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const posts = pgTable(
	"posts",
	{
		id: varchar("id", { length: 21 }).primaryKey(),
		userId: varchar("user_id", { length: 255 })
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
		updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
			() => new Date(),
		),
		deletedAt: timestamp("deleted_at", { mode: "date" }),
	},
	(t) => ({
		userIdx: index("post_user_idx").on(t.userId),
		createdAtIdx: index("post_created_at_idx").on(t.createdAt),
	}),
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export const postRelations = relations(posts, ({ one }) => ({
	user: one(users, {
		fields: [posts.userId],
		references: [users.id],
	}),
}));
