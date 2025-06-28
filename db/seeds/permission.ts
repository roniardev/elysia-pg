import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { config } from "@/app/config"
import * as schema from "@/db/schema"

export async function runPermissionsSeed() {
	const connection = postgres(config.DATABASE_URL)
	const db = drizzle(connection, { schema, logger: true })

	console.log("⏳ Running permissions seeder...")

	const start = Date.now()
	const data: (typeof schema.permissions.$inferInsert)[] = [
		{
			id: "01JM71SE4T1709CSXCF4W3J3XR",
			name: "create:post",
			description: "Create a post",
		},
		{
			id: "01JM71SE4T4DZGY8H5TKXHCTZE",
			name: "update:post",
			description: "Update a post",
		},
		{
			id: "01JM71SE4TD9GTGVBZ6TK8GE6A",
			name: "delete:post",
			description: "Delete a post",
		},
		{
			id: "01JM71SE4THD02JK37P7BWE3BV",
			name: "read-all:post",
			description: "Read all posts",
		},
		{
			id: "01JM71SE4TYDYEBS509C2X11R7",
			name: "read:post",
			description: "Read a post",
		},
		{
			id: "01JM8P67X78PBQKBWT39CCVC5K",
			name: "create:user",
			description: "Create a user",
		},
		{
			id: "01JM8P67X7DD53CVDJ4BPC6TPZ",
			name: "read:user",
			description: "Read a user",
		},
		{
			id: "01JM8P67X7E71QXJ0BMWBB2NHC",
			name: "read-all:user",
			description: "Read all users",
		},
		{
			id: "01JM8P67X7D798NMYK6HC731F1",
			name: "update:user",
			description: "Update a user",
		},
		{
			id: "01JM8P67X7747C3VFZAYJVJMX1",
			name: "delete:user",
			description: "Delete a user",
		},
	]

	try {
		const end = Date.now()

		await db.insert(schema.permissions).values(data)
		console.log(`✅ Permissions Seeding completed in ${end - start}ms`)
	} catch (err) {
		const end = Date.now()
		console.error(`
        ❌ Permissions Seeding failed in ${end - start}ms
        ${err}
        `)
	}
}