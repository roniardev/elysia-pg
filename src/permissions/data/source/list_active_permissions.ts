import { and, asc, desc, isNull, like } from "drizzle-orm"

import Sorting from "@/common/enum/sorting"
import type { Database } from "@/db/database"
import { permissions } from "@/db/schema"
import type { PermissionListQuery } from "@/src/permissions/domain/entity/permission"

export const getListActivePermissions = (
    database: Database,
    param: PermissionListQuery,
) => {
    const conditions = [isNull(permissions.deletedAt)]

    if (param.search) {
        conditions.push(like(permissions.name, `%${param.search}%`))
    }

    let orderBy = desc(permissions.createdAt)

    if (param.sort === Sorting.ASC) {
        orderBy = asc(permissions.createdAt)
    }

    const query = {
        where: and(...conditions),
        orderBy,
    }

    if (param.page === -1) {
        return database.query.permissions.findMany(query)
    }

    return database.query.permissions.findMany({
        ...query,
        limit: param.limit,
        offset: (param.page - 1) * param.limit,
    })
}
