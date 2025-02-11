import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	timestamp,
	varchar,
	pgTable,
} from "drizzle-orm/pg-core";
import { sessions } from "./auth.schema";

export const users = pgTable(
	"users",
	{
		id: varchar("id", { length: 21 }).primaryKey(),
		email: varchar("email", { length: 255 }).unique().notNull(),
		emailVerified: boolean("email_verified").default(false).notNull(),
		hashedPassword: varchar("hashed_password", { length: 255 }),
		photo: varchar("photo", { length: 255 }),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		updatedAt: timestamp("updated_at", { mode: "date" }).$onUpdate(
			() => new Date(),
		),
		sessionId: varchar("session_id", { length: 21 }).unique(),
	},
	(t) => ({
		emailIdx: index("user_email_idx").on(t.email),
		sessionIdx: index("users_session_idx").on(t.sessionId),
	}),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const userRelations = relations(users, ({ one }) => ({
	session: one(sessions, {
		fields: [users.sessionId],
		references: [sessions.id],
	}),
}));
