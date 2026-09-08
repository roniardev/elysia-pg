import * as schema from "@/db/schema"
import type { SeedDatabase } from "@/db/seeds/seed_database"

export async function runScopesSeed(database: SeedDatabase) {
    const start = Date.now()
    const data: (typeof schema.scopes.$inferInsert)[] = [
        {
            id: "01JMBBHZS5Q8X48788FCKFZGGJ",
            name: "global",
            description: "Global scope",
        },
        {
            id: "01JMBBHZS7DTAC9DRT5PQP03VK",
            name: "personal",
            description: "Personal scope",
        },
        {
            id: "01JMBBHZS7Q3BW2DS33P97Z0RA",
            name: "super-admin",
            description: "Super admin scope",
        },
    ]

    await database.insert(schema.scopes).values(data).onConflictDoNothing()
    console.log(`✅ Scopes seeding completed in ${Date.now() - start}ms`)
}
