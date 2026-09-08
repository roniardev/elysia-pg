import { faker } from "@faker-js/faker"
import * as schema from "@/db/schema"
import type { SeedDatabase } from "@/db/seeds/seed_database"

export async function runPostsSeed(database: SeedDatabase) {
    const start = Date.now()
    const data: (typeof schema.posts.$inferInsert)[] = []

    for (let i = 0; i < 8; i++) {
        data.push({
            title: faker.lorem.sentence(10),
            userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
            id: `01JMBPST${String(i).padStart(18, "0")}`,
            status: faker.helpers.arrayElement(["draft", "published"]),
            tags: "random",
            visibility: faker.helpers.arrayElement(["public", "private"]),
            excerpt: faker.lorem.sentence(10),
            content: faker.lorem.paragraph(10),
        })
    }

    await database.insert(schema.posts).values(data).onConflictDoNothing()
    console.log(`✅ Posts seeding completed in ${Date.now() - start}ms`)
}
