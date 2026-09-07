import type { Database } from "@/db/database"

export const getOwnedPostById = (
    database: Database,
    id: string,
    userId: string,
) => database.query.posts.findFirst({
    where: (table, { and, eq }) =>
        and(eq(table.id, id), eq(table.userId, userId)),
})
