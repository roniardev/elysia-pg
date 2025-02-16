/* eslint-disable no-console */
import { faker } from "@faker-js/faker";
import { drizzle } from "drizzle-orm/postgres-js";
import { generateId } from "lucia";
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
			id: "mhk4oxb8askso5tjr9eyt",
			name: "create:post",
			description: "Create a post",
		},
		{
			id: "arvx28b2x9wgkl7qk9x9c",
			name: "update:post",
			description: "Update a post",
		},
		{
			id: "oolwe8214xn9mqrmrn24g",
			name: "delete:post",
			description: "Delete a post",
		},
		{
			id: "a3m8hmgd5xvaz9amdvagw",
			name: "read-all:post",
			description: "Read all posts",
		},
		{
			id: "e5d1rtj5kh5g0rewlp9nb",
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
