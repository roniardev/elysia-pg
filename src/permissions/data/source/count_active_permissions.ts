import { and, isNull, like } from "drizzle-orm"

import type { Database } from "@/db/database"
import { permissions } from "@/db/schema"

export const getCountActivePermissions = (
    database: Database,
    search?: string,
) => {
    const conditions = [isNull(permissions.deletedAt)]

    if (search) {
        conditions.push(like(permissions.name, `%${search}%`))
    }

    return database.$count(permissions, and(...conditions))
}
