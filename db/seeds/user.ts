import * as schema from "@/db/schema"
import type { SeedDatabase } from "@/db/seeds/seed_database"

export async function runUsersSeed(database: SeedDatabase) {
    const start = Date.now()
    const hashedPassword = await Bun.password.hash("satusatu")
    const hashedAdminPassword = await Bun.password.hash("kapitalis")

    const data: (typeof schema.users.$inferInsert)[] = [
        {
            id: "01JM71SE4S1SHAW7YGS6SWQC2H",
            email: "roon.ardiyanto@gmail.com",
            emailVerified: true,
            hashedPassword,
        },
        {
            id: "01JM8P67X5GFPVQDVD82666MPS",
            email: "super@admin.com",
            emailVerified: true,
            hashedPassword: hashedAdminPassword,
        },
    ]

    await database.insert(schema.users).values(data).onConflictDoNothing()
    console.log(`✅ Users seeding completed in ${Date.now() - start}ms`)
}
