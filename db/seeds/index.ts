import { runPermissionsSeed } from "@/db/seeds/permission"
import { runPostsSeed } from "@/db/seeds/post"
import { runScopesSeed } from "@/db/seeds/scope"
import { runScopeUserPermissionsSeed } from "@/db/seeds/scope-user-permissions"
import { runUsersSeed } from "@/db/seeds/user"
import { runUserPermissionsSeed } from "@/db/seeds/user-permissions"
import { makeDatabase } from "@/db/database"

const seed = async () => {
    const { database, close } = makeDatabase()

    try {
        await database.transaction(async (transaction) => {
            await runUsersSeed(transaction)
            await runPermissionsSeed(transaction)
            await runScopesSeed(transaction)
            await runUserPermissionsSeed(transaction)
            await runScopeUserPermissionsSeed(transaction)
            await runPostsSeed(transaction)
        })
        console.log("All seeding completed")
    } catch (error) {
        console.error("Database seeding failed", error)
        process.exitCode = 1
    } finally {
        await close()
    }
}

await seed()
