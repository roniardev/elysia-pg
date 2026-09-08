import { relations, sql } from "drizzle-orm"
import {
    boolean,
    index,
    pgTable,
    timestamp,
    uniqueIndex,
    varchar,
} from "drizzle-orm/pg-core"

import { users } from "@/db/schema/user"

export const emailVerificationTokens = pgTable(
    "email_verification_tokens",
    {
        id: varchar("id", { length: 26 }).primaryKey(),
        userId: varchar("user_id", { length: 26 })
            .notNull()
            .references(() => users.id),
        email: varchar("email", { length: 255 }).notNull(),
        hashedToken: varchar("hashed_token", { length: 255 })
            .unique()
            .notNull(),
        revoked: boolean("revoked").default(false).notNull(),
        expiresAt: timestamp("expires_at", {
            mode: "date",
        }).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        verifiedAt: timestamp("verified_at", {
            mode: "date",
        }),
    },
    (t) => [
        index("verification_code_user_idx").on(t.userId),
        index("verification_code_email_idx").on(t.email),
        index("verification_code_active_lookup_idx")
            .on(t.userId, t.expiresAt)
            .where(sql`${t.revoked} = false AND ${t.verifiedAt} IS NULL`),
        uniqueIndex("verification_code_active_user_unique")
            .on(t.userId)
            .where(sql`${t.revoked} = false AND ${t.verifiedAt} IS NULL`),
    ],
)

export const passwordResetTokens = pgTable(
    "password_reset_tokens",
    {
        id: varchar("id", { length: 26 }).primaryKey(),
        userId: varchar("user_id", { length: 26 })
            .notNull()
            .references(() => users.id),
        hashedToken: varchar("hashed_token", { length: 255 })
            .unique()
            .notNull(),
        revoked: boolean("revoked").default(false).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        expiresAt: timestamp("expires_at", {
            mode: "date",
        }).notNull(),
    },
    (t) => [
        index("password_token_user_idx").on(t.userId),
        index("password_token_active_lookup_idx")
            .on(t.userId, t.expiresAt)
            .where(sql`${t.revoked} = false`),
    ],
)

export const emailVerificationTokenRelations = relations(
    emailVerificationTokens,
    ({ one }) => ({
        user: one(users, {
            fields: [emailVerificationTokens.userId],
            references: [users.id],
        }),
    }),
)

export const passwordResetTokenRelations = relations(
    passwordResetTokens,
    ({ one }) => ({
        user: one(users, {
            fields: [passwordResetTokens.userId],
            references: [users.id],
        }),
    }),
)
