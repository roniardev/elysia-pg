import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { userPermissions } from "@/db/schema/user-permissions"
import type { UpdateUserPermissionParam } from "@/src/user-permissions/domain/entity/user_permission"
import type { Locks } from "@/utils/services/lock-manager"

export const updateUserPermission = (
    database: Database,
    locks: Locks,
    id: string,
    param: UpdateUserPermissionParam,
    lockOwner: string,
) => locks.createLock(`${lockOwner}:update-user-permission`).run(async () => {
    const [updated] = await database
        .update(userPermissions)
        .set({
            revoked: param.revoked,
            updatedAt: new Date(),
        })
        .where(eq(userPermissions.id, id))
        .returning()

    return updated
})
