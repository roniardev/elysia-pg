import type { Database } from "@/db/database"

export const findActiveEmailVerificationToken = (
    database: Database,
    userId: string,
) => database.query.emailVerificationTokens.findFirst({
    where: (table, { and, eq }) =>
        and(eq(table.userId, userId), eq(table.revoked, false)),
})
