import type { Database } from "@/db/database"
import type { CreateUserPermissionParam } from "@/src/user-permissions/domain/entity/user_permission"

export const getActiveUserPermissionAssignment = (
    database: Database,
    param: CreateUserPermissionParam,
) => database.query.userPermissions.findFirst({
    where: (fields, { and, eq }) =>
        and(
            eq(fields.userId, param.userId),
            eq(fields.permissionId, param.permissionId),
            eq(fields.revoked, false),
        ),
})
