import type { Database } from "@/db/database"

export const findActivePasswordResetToken = (
    database: Database,
    userId: string,
) => database.query.passwordResetTokens.findFirst({
    where: (table, { and, eq }) =>
        and(eq(table.userId, userId), eq(table.revoked, false)),
})
