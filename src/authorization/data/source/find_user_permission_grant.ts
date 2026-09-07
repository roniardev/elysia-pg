import type { Database } from "@/db/database"
import type { PermissionName } from "@/src/authorization/domain/entity/authorization"

export const getUserPermissionGrant = async (
    database: Database,
    userId: string,
    permission: PermissionName,
) => {
    const userPermissions = await database.query.userPermissions.findMany({
        where: (table, { and, eq }) =>
            and(eq(table.userId, userId), eq(table.revoked, false)),
        with: {
            permission: true,
            scopeUserPermissions: {
                with: {
                    scope: true,
                },
            },
        },
    })
    const userPermission = userPermissions.find(
        (candidate) => candidate.permission?.name === permission,
    )

    if (!userPermission) {
        return null
    }

    return {
        id: userPermission.id,
        scope: userPermission.scopeUserPermissions[0]?.scope?.name ?? null,
    }
}
