import type { Database } from "@/db/database"
import { passwordResetTokens } from "@/db/schema"
import type { Locks } from "@/utils/services/lock-manager"

export const createPasswordResetToken = (
    database: Database,
    locks: Locks,
    param: {
        expiresAt: Date
        hashedToken: string
        id: string
        userId: string
    },
    lockOwner: string,
) => locks.createLock(lockOwner).run(async () => {
    await database.insert(passwordResetTokens).values(param)
})
