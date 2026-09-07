import { and, isNull } from "drizzle-orm"

import type { Database } from "@/db/database"
import { users } from "@/db/schema"
import type { UserListQuery } from "@/src/users/domain/entity/user"

export const getListActiveUsers = (
    database: Database,
    { limit, page }: UserListQuery,
) => {
    const query = {
        where: and(isNull(users.deletedAt)),
        with: {
            permissions: true,
        },
    } as const

    if (page === -1) {
        return database.query.users.findMany(query)
    }

    return database.query.users.findMany({
        ...query,
        limit,
        offset: (page - 1) * limit,
    })
}
