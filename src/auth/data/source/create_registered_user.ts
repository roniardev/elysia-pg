import type { Database } from "@/db/database"
import { users } from "@/db/schema"
import type { Locks } from "@/utils/services/lock-manager"

export const createRegisteredUser = (
    database: Database,
    locks: Locks,
    param: {
        email: string
        hashedPassword: string
        id: string
    },
) => locks.createLock(`${param.email}:register`).run(async () => {
    await database.insert(users).values({
        ...param,
        emailVerified: false,
    })
})
