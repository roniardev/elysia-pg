import { runPermissionsSeed } from "@/db/seeds/permission"
import { runPostsSeed } from "@/db/seeds/post"
import { runScopesSeed } from "@/db/seeds/scope"
import { runScopeUserPermissionsSeed } from "@/db/seeds/scope-user-permissions"
import { runUsersSeed } from "@/db/seeds/user"
import { runUserPermissionsSeed } from "@/db/seeds/user-permissions"

const tasks = [
    runUsersSeed,
    runPermissionsSeed,
    runUserPermissionsSeed,
    runPostsSeed,
    runScopesSeed,
    runScopeUserPermissionsSeed,
]

tasks
    .reduce(async (prevPromise, nextTask) => {
        try {
            // Tunggu sampai task sebelumnya selesai (success atau error)
            await prevPromise
        } catch (err) {
            // Tangkap error dari task sebelumnya, tapi lanjutkan eksekusi
            console.error("Prev seeding error:", err)
        }
        // Jalankan task berikutnya dan return promise-nya
        return nextTask()
    }, Promise.resolve())
    .catch((err) => {
        // Handle error terakhir (jika ada)
        console.error("Last seeding error:", err)
    })
    .finally(() => {
        // Exit proses setelah semua task selesai
        console.log("All seeding completed")
        process.exit(0) // atau process.exit(1) jika ingin exit code error
    })
