import type { Database } from "@/db/database"
import { permissions } from "@/db/schema"
import type { CreatePermissionRecord } from "@/src/permissions/domain/entity/permission"

export const createPermission = async (
    database: Database,
    param: CreatePermissionRecord,
) => {
    const [permission] = await database
        .insert(permissions)
        .values(param)
        .returning()

    if (!permission) {
        throw new Error("Permission insert returned no record")
    }

    return permission
}
