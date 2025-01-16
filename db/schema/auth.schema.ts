import {
	boolean,
	index,
	serial,
	timestamp,
	varchar,
	pgTable,
} from "drizzle-orm/pg-core";

export const refreshToken = pgTable(
	"refresh_token",
	{
		id: varchar("id", { length: 21 }).primaryKey(),
		hashedToken: varchar("hashed_token", { length: 255 }).unique().notNull(),
		userId: varchar("user_id", { length: 21 }).notNull(),
		sessionId: varchar("session_id", { length: 21 }).notNull(),
		revoked: boolean("revoked").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
	},
	(t) => ({
		userIdx: index("refresh_token_user_idx").on(t.userId),
		sessionIdx: index("refresh_token_session_idx").on(t.sessionId),
	}),
);

export const sessions = pgTable(
	"sessions",
	{
		id: varchar("id", { length: 255 }).primaryKey(),
		userId: varchar("user_id", { length: 21 }).notNull(),
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
		userId: varchar("user_id", { length: 21 }).unique().notNull(),
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
		userId: varchar("user_id", { length: 21 }).notNull(),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
	},
	(t) => ({
		userIdx: index("password_token_user_idx").on(t.userId),
	}),
);
