import type { Database } from "@/db/database"

export const findAuthUserById = (database: Database, id: string) =>
    database.query.users.findFirst({
        where: (table, { and, eq, isNull }) =>
            and(eq(table.id, id), isNull(table.deletedAt)),
    })
