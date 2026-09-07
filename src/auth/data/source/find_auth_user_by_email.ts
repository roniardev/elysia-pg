import type { Database } from "@/db/database"

export const findAuthUserByEmail = (
    database: Database,
    email: string,
    verifiedOnly = false,
) => database.query.users.findFirst({
    where: (table, { and, eq, isNull }) => {
        const conditions = [
            eq(table.email, email),
            isNull(table.deletedAt),
        ]

        if (verifiedOnly) {
            conditions.push(eq(table.emailVerified, true))
        }

        return and(...conditions)
    },
})
