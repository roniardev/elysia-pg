import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { config } from "@/app/config";
import * as schema from "@/db/schema";

export async function runPermissionsSeed() {
	const connection = postgres(config.DATABASE_URL);
	const db = drizzle(connection, { schema, logger: true });

	console.log("⏳ Running permissions seeder...");

	const start = Date.now();
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
	];

	try {
		const end = Date.now();

		await db.insert(schema.permissions).values(data);
		console.log(`✅ Permissions Seeding completed in ${end - start}ms`);
	} catch (err) {
		const end = Date.now();
		console.error(`
        ❌ Permissions Seeding failed in ${end - start}ms
        ${err}
        `);
	}
}
