import type { Database } from "@/db/database"
import { userPermissions } from "@/db/schema/user-permissions"
import type { CreateUserPermissionRecord } from "@/src/user-permissions/domain/entity/user_permission"

export const createUserPermission = async (
    database: Database,
    param: CreateUserPermissionRecord,
) => {
    await database.insert(userPermissions).values(param)
}
