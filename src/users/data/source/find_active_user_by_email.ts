import type { Database } from "@/db/database"

export const getActiveUserByEmail = async (
    database: Database,
    email: string,
) => {
    const user = await database.query.users.findFirst({
        where: (table, { and, eq, isNull }) =>
            and(eq(table.email, email), isNull(table.deletedAt)),
        with: {
            permissions: true,
        },
    })

    return user ?? null
}
