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
		// Organization Permissions
		{
			id: "01JMORG1CREATE000000000001",
			name: "create:organization",
			description: "Create an organization",
		},
		{
			id: "01JMORG2READ0000000000002",
			name: "read:organization",
			description: "Read an organization",
		},
		{
			id: "01JMORG3READALL00000000003",
			name: "read-all:organization",
			description: "Read all organizations",
		},
		{
			id: "01JMORG4UPDATE000000000004",
			name: "update:organization",
			description: "Update an organization",
		},
		{
			id: "01JMORG5DELETE000000000005",
			name: "delete:organization",
			description: "Delete an organization",
		},
		{
			id: "01JMORG6SWITCH000000000006",
			name: "switch:organization",
			description: "Switch active organization",
		},
		{
			id: "01JMORG7MEMBERS00000000007",
			name: "manage:members",
			description: "Manage organization members",
		},
		// Spatial Data Permissions
		{
			id: "01JMSPATIAL1CREATE0000001",
			name: "create:spatial-data",
			description: "Create spatial data",
		},
		{
			id: "01JMSPATIAL2READ00000002",
			name: "read:spatial-data",
			description: "Read spatial data",
		},
		{
			id: "01JMSPATIAL3READALL0003",
			name: "read-all:spatial-data",
			description: "Read all spatial data",
		},
		{
			id: "01JMSPATIAL4UPDATE00004",
			name: "update:spatial-data",
			description: "Update spatial data",
		},
		{
			id: "01JMSPATIAL5DELETE00005",
			name: "delete:spatial-data",
			description: "Delete spatial data",
		},
		// Spatial Layer Permissions
		{
			id: "01JMSPLAYER1CREATE0006",
			name: "create:spatial-layer",
			description: "Create spatial layer",
		},
		{
			id: "01JMSPLAYER2READ000007",
			name: "read:spatial-layer",
			description: "Read spatial layer",
		},
		{
			id: "01JMSPLAYER3READALL008",
			name: "read-all:spatial-layer",
			description: "Read all spatial layers",
		},
		{
			id: "01JMSPLAYER4UPDATE0009",
			name: "update:spatial-layer",
			description: "Update spatial layer",
		},
		{
			id: "01JMSPLAYER5DELETE0010",
			name: "delete:spatial-layer",
			description: "Delete spatial layer",
		},
		// Spatial Map Permissions
		{
			id: "01JMSPMAP1CREATE000011",
			name: "create:spatial-map",
			description: "Create spatial map",
		},
		{
			id: "01JMSPMAP2READ0000012",
			name: "read:spatial-map",
			description: "Read spatial map",
		},
		{
			id: "01JMSPMAP3READALL0013",
			name: "read-all:spatial-map",
			description: "Read all spatial maps",
		},
		{
			id: "01JMSPMAP4UPDATE00014",
			name: "update:spatial-map",
			description: "Update spatial map",
		},
		{
			id: "01JMSPMAP5DELETE00015",
			name: "delete:spatial-map",
			description: "Delete spatial map",
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