import { sql } from "drizzle-orm"
import type { Database } from "@/db/database"

export const findAuthUserByEmail = (
    database: Database,
    email: string,
    verifiedOnly = false,
) => database.query.users.findFirst({
    where: (table, { and, eq, isNull }) => {
        const conditions = [
            sql`lower(${table.email}) = lower(${email})`,
            isNull(table.deletedAt),
        ]

        if (verifiedOnly) {
            conditions.push(eq(table.emailVerified, true))
        }

        return and(...conditions)
    },
})
