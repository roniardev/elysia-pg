import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { ulid } from "ulid"

import * as schema from "@/db/schema"
import { config } from "@/app/config"

export async function runOrganizationsSeed() {
	const connection = postgres(config.DATABASE_URL)
	const db = drizzle(connection, { schema, logger: true })

	console.log("⏳ Running organizations seeder...")

	const start = Date.now()

	const organizationData: (typeof schema.organizations.$inferInsert)[] = [
		{
			id: "01JM71ORG1SHAW7YGS6SWQC2H",
			name: "Acme Corporation",
			slug: "acme-corp",
			ownerId: "01JM71SE4S1SHAW7YGS6SWQC2H",
		},
		{
			id: "01JM71ORG2SHAW7YGS6SWQC2H",
			name: "Tech Innovators Inc",
			slug: "tech-innovators",
			ownerId: "01JM8P67X5GFPVQDVD82666MPS",
		},
		{
			id: "01JM71ORG3SHAW7YGS6SWQC2H",
			name: "Digital Solutions Ltd",
			slug: "digital-solutions",
			ownerId: "01JM71SE4S1SHAW7YGS6SWQC2H",
		},
	]

	const userOrgData: (typeof schema.userOrganizations.$inferInsert)[] = [
		{
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			organizationId: "01JM71ORG1SHAW7YGS6SWQC2H",
			role: "owner",
		},
		{
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			organizationId: "01JM71ORG2SHAW7YGS6SWQC2H",
			role: "owner",
		},
		{
			userId: "01JM71SE4S1SHAW7YGS6SWQC2H",
			organizationId: "01JM71ORG3SHAW7YGS6SWQC2H",
			role: "owner",
		},
		{
			userId: "01JM8P67X5GFPVQDVD82666MPS",
			organizationId: "01JM71ORG1SHAW7YGS6SWQC2H",
			role: "member",
		},
	]

	try {
		await db.insert(schema.organizations).values(organizationData)
		await db.insert(schema.userOrganizations).values(userOrgData)

		const end = Date.now()
		console.log(`✅ Organizations Seeding completed in ${end - start}ms`)
	} catch (err) {
		const end = Date.now()
		console.error(`
        ❌ Organizations Seeding failed in ${end - start}ms
        ${err}
        `)
	}
}
