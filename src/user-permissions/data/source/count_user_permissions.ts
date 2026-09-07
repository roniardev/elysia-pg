import type { Database } from "@/db/database"
import { userPermissions } from "@/db/schema/user-permissions"
import { buildUserPermissionWhere } from "@/src/user-permissions/data/source/list_user_permissions"
import type { UserPermissionListQuery } from "@/src/user-permissions/domain/entity/user_permission"

export const getCountUserPermissions = (
    database: Database,
    param: UserPermissionListQuery,
) => database.$count(userPermissions, buildUserPermissionWhere(param))
