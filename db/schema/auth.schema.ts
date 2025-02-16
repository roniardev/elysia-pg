import {
	boolean,
	index,
	timestamp,
	varchar,
	pgTable,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

import { users } from "./user.schema";

export const emailVerificationTokens = pgTable(
	"email_verification_tokens",
	{
		id: varchar("id", { length: 21 }).primaryKey(),
		userId: varchar("user_id", { length: 21 })
			.unique()
			.notNull()
			.references(() => users.id),
		email: varchar("email", { length: 255 }).notNull(),
		hashedToken: varchar("hashed_token", { length: 255 }).unique().notNull(),
		revoked: boolean("revoked").default(false).notNull(),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		verifiedAt: timestamp("verified_at", {
			withTimezone: true,
			mode: "date",
		}),
	},
	(t) => ({
		userIdx: index("verification_code_user_idx").on(t.userId),
		emailIdx: index("verification_code_email_idx").on(t.email),
	}),
);

export const passwordResetTokens = pgTable(
	"password_reset_tokens",
	{
		id: varchar("id", { length: 21 }).primaryKey(),
		userId: varchar("user_id", { length: 21 })
			.notNull()
			.references(() => users.id),
		hashedToken: varchar("hashed_token", { length: 255 }).unique().notNull(),
		revoked: boolean("revoked").default(false).notNull(),
		createdAt: timestamp("created_at").defaultNow().notNull(),
		expiresAt: timestamp("expires_at", {
			withTimezone: true,
			mode: "date",
		}).notNull(),
	},
	(t) => ({
		userIdx: index("password_token_user_idx").on(t.userId),
	}),
);

export const emailVerificationTokenRelations = relations(
	emailVerificationTokens,
	({ one }) => ({
		user: one(users, {
			fields: [emailVerificationTokens.userId],
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
