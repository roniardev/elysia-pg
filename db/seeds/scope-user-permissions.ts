/* eslint-disable no-console */
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

import { config } from "@/app/config"
import * as schema from "@/db/schema"

export async function runScopeUserPermissionsSeed() {
	const connection = postgres(config.DATABASE_URL)
	const db = drizzle(connection, { schema, logger: true })

	console.log("⏳ Running scope user permissions seeder...")

	const start = Date.now()
	const data: (typeof schema.scopeUserPermissions.$inferInsert)[] = [
		// User Manage Post Permissions
		{
			id: "01JMBCCAN9ZN30D7B5NXK3HNG6",
			scopeId: "01JMBBHZS7DTAC9DRT5PQP03VK",
			userPermissionId: "01JMBB83W2ZN2W8VVVG8BF0B3J",
		},
		{
			id: "01JMBCCANAWM7PYBQC9C7MGXZB",
			scopeId: "01JMBBHZS7DTAC9DRT5PQP03VK",
			userPermissionId: "01JMBB83W4J137JNASFYT4JK6J",
		},
		{
			id: "01JMBCCANACW0HCHWE09JGCJTZ",
			scopeId: "01JMBBHZS7DTAC9DRT5PQP03VK",
			userPermissionId: "01JMBB83W45SGCQ1Q2NQEP4NMJ",
		},
		{
			id: "01JMBCCANAW98QJBH6YZD96FPG",
			scopeId: "01JMBBHZS7DTAC9DRT5PQP03VK",
			userPermissionId: "01JMBB83W4N4RMXV3Y1FX8KBM7",
		},
		{
			id: "01JMBCCANAVVB0S1214NN9E643",
			scopeId: "01JMBBHZS7DTAC9DRT5PQP03VK",
			userPermissionId: "01JMBB83W4S9N05NNXBA9MZ7DH",
		},
		// Super Admin Manage User Permissions
		{
			id: "01JMBCCANAS9M2A63N2MEG4BMJ",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W44VF2K1HQFWSH5MT8",
		},
		{
			id: "01JMBCCANARTAAXD2RDVZMQKZ6",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W4X0QSFF1E42Q89KF3",
		},
		{
			id: "01JMBCCANAQJ0EC0C8F7G7JAP7",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W4YWY1TQ6PG01PFVFS",
		},
		{
			id: "01JMBCCANAQP967VKKHE467FJ3",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W4P4TKKBDFZJRVCN6S",
		},
		{
			id: "01JMBCCANBASFBQXVDA6SBGRGD",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W4YCEGCAZCPKKJ175T",
		},
		// Super Admin Manage Post Permissions
		{
			id: "01JMBCCANBEW7ZZ26N7YCGQGVK",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W47CH6DEKDETP0G3HC",
		},
		{
			id: "01JMBCCANB09NFWBYQP58KDE5V",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W4NT41F415RV7W7DHB",
		},
		{
			id: "01JMBCCANB1D3JG6A8R7T1TSDA",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W4T1Q2NMZWKQ704YCZ",
		},
		{
			id: "1JMBCCANBYVC2WCCE9VSZN02V",
			scopeId: "01JMBBHZS7Q3BW2DS33P97Z0RA",
			userPermissionId: "01JMBB83W46SYQFD3BS4TGD1CW",
		},
	]

	try {
		const end = Date.now()

		await db.insert(schema.scopeUserPermissions).values(data)
		console.log(
			`✅ Scope User Permissions Seeding completed in ${end - start}ms`,
		)
	} catch (err) {
		const end = Date.now()
		console.error(`
        ❌ User Permissions Seeding failed in ${end - start}ms
        ${err}
        `)
	}
}