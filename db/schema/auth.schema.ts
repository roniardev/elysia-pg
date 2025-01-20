import {
	boolean,
	index,
	serial,
	timestamp,
	varchar,
	pgTable,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";
import { relations } from "drizzle-orm";

export const refreshToken = pgTable(
	"refresh_token",
	{
		id: varchar("id", { length: 21 }).primaryKey(),
		hashedToken: varchar("hashed_token", { length: 255 }).unique().notNull(),
		sessionId: varchar("session_id", { length: 21 })
			.notNull()
			.references(() => sessions.id),
		revoked: boolean("revoked").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		sessionIdx: index("refresh_token_session_idx").on(t.sessionId),
	}),
);

export const sessions = pgTable(
	"sessions",
	{
		id: varchar("id", { length: 255 }).primaryKey(),
		userId: varchar("user_id", { length: 21 })
			.notNull()
			.references(() => users.id),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
		ip: varchar("ip", { length: 255 }).notNull(),
	},
	(t) => ({
		userIdx: index("session_user_idx").on(t.userId),
	}),
);

export const emailVerificationCodes = pgTable(
	"email_verification_codes",
	{
		id: serial("id").primaryKey(),
		userId: varchar("user_id", { length: 21 })
			.unique()
			.notNull()
			.references(() => users.id),
		email: varchar("email", { length: 255 }).notNull(),
		code: varchar("code", { length: 8 }).notNull(),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
	},
	(t) => ({
		userIdx: index("verification_code_user_idx").on(t.userId),
		emailIdx: index("verification_code_email_idx").on(t.email),
	}),
);

export const passwordResetTokens = pgTable(
	"password_reset_tokens",
	{
		id: varchar("id", { length: 40 }).primaryKey(),
		userId: varchar("user_id", { length: 21 })
			.notNull()
			.references(() => users.id),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
	},
	(t) => ({
		userIdx: index("password_token_user_idx").on(t.userId),
	}),
);

export const refreshTokenRelations = relations(refreshToken, ({ one }) => ({
	session: one(sessions, {
		fields: [refreshToken.sessionId],
		references: [sessions.id],
	}),
}));

export const sessionRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id],
	}),
}));

export const emailVerificationCodeRelations = relations(
	emailVerificationCodes,
	({ one }) => ({
		user: one(users, {
			fields: [emailVerificationCodes.userId],
			references: [users.id],
		}),
	}),
);

export const passwordResetTokenRelations = relations(
	passwordResetTokens,
	({ one }) => ({
		user: one(users, {
			fields: [passwordResetTokens.userId],
			references: [users.id],
		}),
	}),
);
