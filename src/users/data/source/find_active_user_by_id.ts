import type { Database } from "@/db/database"

export const getActiveUserById = async (
    database: Database,
    id: string,
) => {
    const user = await database.query.users.findFirst({
        where: (table, { and, eq, isNull }) =>
            and(eq(table.id, id), isNull(table.deletedAt)),
        with: {
            permissions: true,
        },
    })

    return user ?? null
}
