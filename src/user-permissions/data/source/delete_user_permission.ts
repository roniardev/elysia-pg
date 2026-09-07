import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { userPermissions } from "@/db/schema/user-permissions"
import type { Locks } from "@/utils/services/lock-manager"

export const deleteUserPermission = (
    database: Database,
    locks: Locks,
    id: string,
    lockOwner: string,
) => locks.createLock(`${lockOwner}:delete-user-permission`).run(async () => {
    await database.delete(userPermissions).where(eq(userPermissions.id, id))
})
