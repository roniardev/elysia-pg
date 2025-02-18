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
		// User Manage Post Permissions
		{
			id: "01JMBB83W2ZN2W8VVVG8BF0B3J",
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4T1709CSXCF4W3J3XR",
		},
		{
			id: "01JMBB83W4J137JNASFYT4JK6J",
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4T4DZGY8H5TKXHCTZE",
		},
		{
			id: "01JMBB83W45SGCQ1Q2NQEP4NMJ",
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4TD9GTGVBZ6TK8GE6A",
		},
		{
			id: "01JMBB83W4N4RMXV3Y1FX8KBM7",
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4THD02JK37P7BWE3BV",
		},
		{
			id: "01JMBB83W4S9N05NNXBA9MZ7DH",
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			permissionId: "01JM71SE4TYDYEBS509C2X11R7",
		},
		// Super Admin Manage User Permissions
		{
			id: "01JMBB83W44VF2K1HQFWSH5MT8",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM8P67X78PBQKBWT39CCVC5K",
		},
		{
			id: "01JMBB83W4X0QSFF1E42Q89KF3",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM8P67X7DD53CVDJ4BPC6TPZ",
		},
		{
			id: "01JMBB83W4YWY1TQ6PG01PFVFS",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM8P67X7E71QXJ0BMWBB2NHC",
		},
		{
			id: "01JMBB83W4P4TKKBDFZJRVCN6S",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM8P67X7D798NMYK6HC731F1",
		},
		{
			id: "01JMBB83W4YCEGCAZCPKKJ175T",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM8P67X7747C3VFZAYJVJMX1",
		},
		// Super Admin Manage Post Permissions
		{
			id: "01JMBB83W458VCQ8KT4DP4FQH2",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM71SE4T1709CSXCF4W3J3XR",
		},
		{
			id: "01JMBB83W47CH6DEKDETP0G3HC",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM71SE4T4DZGY8H5TKXHCTZE",
		},
		{
			id: "01JMBB83W4NT41F415RV7W7DHB",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM71SE4TD9GTGVBZ6TK8GE6A",
		},
		{
			id: "01JMBB83W4T1Q2NMZWKQ704YCZ",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			permissionId: "01JM71SE4THD02JK37P7BWE3BV",
		},
		{
			id: "01JMBB83W46SYQFD3BS4TGD1CW",
			userId: "01JM8P67X5GFPVQDVD82666MPS",
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
