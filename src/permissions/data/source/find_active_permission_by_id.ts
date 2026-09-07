import type { Database } from "@/db/database"

export const getActivePermissionById = async (
    database: Database,
    id: string,
) => {
    const permission = await database.query.permissions.findFirst({
        where: (table, { and, eq, isNull }) =>
            and(eq(table.id, id), isNull(table.deletedAt)),
    })

    return permission ?? null
}
