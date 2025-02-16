/* eslint-disable no-console */
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "@/db/schema";
import { config } from "@/app/config";

export async function runUsersSeed() {
	const connection = postgres(config.DATABASE_URL);
	const db = drizzle(connection, { schema, logger: true });

	console.log("⏳ Running users seeder...");

	const start = Date.now();
	const data: (typeof schema.users.$inferInsert)[] = [];
	const hashedPassword = await Bun.password.hash("satusatu");

	for (let i = 0; i < 1; i++) {
		data.push({
			id: "01JM71SE4S1SHAW7YGS6SWQC2H",
			email: "roon.ardiyanto@gmail.com",
			emailVerified: true,
			hashedPassword,
		});
	}

	try {
		const end = Date.now();

		await db.insert(schema.users).values(data);
		console.log(`✅ Users Seeding completed in ${end - start}ms`);
	} catch (err) {
		const end = Date.now();
		console.error(`
        ❌ Posts Seeding failed in ${end - start}ms
        ${err}
        `);
	}
}
