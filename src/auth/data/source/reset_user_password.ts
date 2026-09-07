import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { users } from "@/db/schema"
import type { Locks } from "@/utils/services/lock-manager"

export const resetUserPassword = (
    database: Database,
    locks: Locks,
    userId: string,
    hashedPassword: string,
) => locks.createLock(`${userId}:reset-password`).run(async () => {
    await database
        .update(users)
        .set({ hashedPassword })
        .where(eq(users.id, userId))
})
