/* eslint-disable no-console */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { config } from "@/app/config";
import * as schema from "@/db/schema";

export async function runUserPermissionsSeed() {
	const connection = postgres(config.DATABASE_URL);
	const db = drizzle(connection, { schema, logger: true });

	console.log("⏳ Running user permissions seeder...");

	const start = Date.now();
	const data: (typeof schema.userPermissions.$inferInsert)[] = [
		{
			userId: "m7xa8kd9xx40kn3qrtrgo",
			permissionId: "mhk4oxb8askso5tjr9eyt",
		},
		{
			userId: "m7xa8kd9xx40kn3qrtrgo",
			permissionId: "arvx28b2x9wgkl7qk9x9c",
		},
		{
			userId: "m7xa8kd9xx40kn3qrtrgo",
			permissionId: "oolwe8214xn9mqrmrn24g",
		},
		{
			userId: "m7xa8kd9xx40kn3qrtrgo",
			permissionId: "a3m8hmgd5xvaz9amdvagw",
		},
		{
			userId: "m7xa8kd9xx40kn3qrtrgo",
			permissionId: "e5d1rtj5kh5g0rewlp9nb",
		},
	];

	try {
		const end = Date.now();

		await db.insert(schema.userPermissions).values(data);
		console.log(`✅ User Permissions Seeding completed in ${end - start}ms`);
	} catch (err) {
		const end = Date.now();
		console.error(`
        ❌ User Permissions Seeding failed in ${end - start}ms
        ${err}
        `);
	}
}
