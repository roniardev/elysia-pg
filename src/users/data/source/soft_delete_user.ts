import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { users } from "@/db/schema"
import type { Locks } from "@/utils/services/lock-manager"

export const deleteUser = (
    database: Database,
    locks: Locks,
    id: string,
) =>
    locks.createLock(`${id}:delete-user`).run(async () => {
        await new Promise((resolve) => setTimeout(resolve, 15000))
        await database
            .update(users)
            .set({
                deletedAt: new Date(),
            })
            .where(eq(users.id, id))
    })
