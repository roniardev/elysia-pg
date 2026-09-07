import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { permissions } from "@/db/schema"
import type { PermissionUpdate } from "@/src/permissions/domain/entity/permission"
import type { Locks } from "@/utils/services/lock-manager"

export const updatePermission = async (
    database: Database,
    locks: Locks,
    id: string,
    param: PermissionUpdate,
    lockOwner: string,
) => {
    const result = await locks
        .createLock(`${lockOwner}:update-permission`)
        .run(async () => {
            await database
                .update(permissions)
                .set({
                    ...param,
                    updatedAt: new Date(),
                })
                .where(eq(permissions.id, id))

            return database.query.permissions.findFirst({
                where: (table, { eq }) => eq(table.id, id),
            })
        })

    if (!result[0]) {
        return null
    }

    return result[1] ?? null
}
