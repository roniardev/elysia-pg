import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { permissions } from "@/db/schema"
import type { Locks } from "@/utils/services/lock-manager"

export const deletePermission = (
    database: Database,
    locks: Locks,
    id: string,
    lockOwner: string,
) =>
    locks
        .createLock(`${lockOwner}:delete-permission`)
        .run(async () => {
            await database
                .update(permissions)
                .set({ deletedAt: new Date() })
                .where(eq(permissions.id, id))
        })
