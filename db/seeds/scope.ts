import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { config } from "@/app/config"
import * as schema from "@/db/schema"

export async function runScopesSeed() {
	const connection = postgres(config.DATABASE_URL)
	const db = drizzle(connection, { schema, logger: true })

	console.log("⏳ Running scopes seeder...")

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

	try {
		const end = Date.now()

		await db.insert(schema.scopes).values(data)
		console.log(`✅ Scopes Seeding completed in ${end - start}ms`)
	} catch (err) {
		const end = Date.now()
		console.error(`
        ❌ Scopes Seeding failed in ${end - start}ms
        ${err}
        `)
	}
}