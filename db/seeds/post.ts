import { faker } from "@faker-js/faker"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { config } from "@/app/config"
import * as schema from "@/db/schema"
import { ulid } from "ulid"

export async function runPostsSeed() {
	const connection = postgres(config.DATABASE_URL)
	const db = drizzle(connection, { schema, logger: true })

	console.log("⏳ Running posts seeder...")

	const start = Date.now()
	const data: (typeof schema.posts.$inferInsert)[] = []

	for (let i = 0; i < 8; i++) {
		data.push({
			title: faker.lorem.sentence(10),
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			id: ulid(),
			status: faker.helpers.arrayElement(["draft", "published"]),
			tags: "random",
			visibility: faker.helpers.arrayElement(["public", "private"]),
			excerpt: faker.lorem.sentence(10),
			content: faker.lorem.paragraph(10),
		})
	}

	try {
		const end = Date.now()

		await db.insert(schema.posts).values(data)
		console.log(`✅ Posts Seeding completed in ${end - start}ms`)
	} catch (err) {
		const end = Date.now()
		console.error(`
        ❌ Posts Seeding failed in ${end - start}ms
        ${err}
        `)
	}
}