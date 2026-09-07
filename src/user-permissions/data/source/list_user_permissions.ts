import { and, desc, eq, type SQL } from "drizzle-orm"

import type { Database } from "@/db/database"
import { userPermissions } from "@/db/schema/user-permissions"
import type { UserPermissionListQuery } from "@/src/user-permissions/domain/entity/user_permission"

export const buildUserPermissionWhere = (
    param: UserPermissionListQuery,
): SQL<unknown> => {
    const conditions = [eq(userPermissions.userId, param.userId)]

    if (!param.includeRevoked) {
        conditions.push(eq(userPermissions.revoked, false))
    }

    return and(...conditions) as SQL<unknown>
}

export const getListUserPermissions = (
    database: Database,
    param: UserPermissionListQuery,
) => {
    if (param.page === -1) {
        return database.query.userPermissions.findMany({
            where: () => buildUserPermissionWhere(param),
            with: {
                permission: true,
            },
            orderBy: [desc(userPermissions.createdAt)],
        })
    }

    return database.query.userPermissions.findMany({
        where: () => buildUserPermissionWhere(param),
        with: {
            permission: true,
        },
        limit: param.limit,
        offset: (param.page - 1) * param.limit,
        orderBy: [desc(userPermissions.createdAt)],
    })
}
