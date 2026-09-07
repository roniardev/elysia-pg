import { eq } from "drizzle-orm"

import type { Database } from "@/db/database"
import { emailVerificationTokens, users } from "@/db/schema"
import type { Locks } from "@/utils/services/lock-manager"

export const verifyUserEmail = async (
    database: Database,
    locks: Locks,
    tokenId: string,
    userId: string,
) => {
    await database
        .update(emailVerificationTokens)
        .set({ revoked: true })
        .where(eq(emailVerificationTokens.id, tokenId))

    await locks.createLock(`${userId}:verify-email`).run(async () => {
        await database
            .update(users)
            .set({ emailVerified: true })
            .where(eq(users.id, userId))
    })
}
