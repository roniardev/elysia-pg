import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	timestamp,
	varchar,
	pgTable,
} from "drizzle-orm/pg-core";
import { refreshToken } from "./auth.schema";

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
		googleId: varchar("google_id", { length: 255 }).unique(),
		refreshTokenId: varchar("refresh_token_id", { length: 21 }).unique(),
	},
	(t) => ({
		emailIdx: index("user_email_idx").on(t.email),
		googleIdx: index("user_google_idx").on(t.googleId),
		refreshTokenIdx: index("user_refresh_token_idx").on(t.refreshTokenId),
	}),
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export const userRelations = relations(users, ({ one }) => ({
	refreshToken: one(refreshToken, {
		fields: [users.refreshTokenId],
		references: [refreshToken.id],
	}),
}));
