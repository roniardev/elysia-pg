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
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4T1709CSXCF4W3J3XR",
		},
		{
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4T4DZGY8H5TKXHCTZE",
		},
		{
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4TD9GTGVBZ6TK8GE6A",
		},
		{
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4THD02JK37P7BWE3BV",
		},
		{
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4TYDYEBS509C2X11R7",
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
