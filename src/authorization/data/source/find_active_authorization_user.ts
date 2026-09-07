import type { Database } from "@/db/database"

export const getActiveAuthorizationUser = (
    database: Database,
    userId: string,
) => database.query.users.findFirst({
    columns: {
        id: true,
    },
    where: (table, { and, eq, isNull }) =>
        and(eq(table.id, userId), isNull(table.deletedAt)),
})
