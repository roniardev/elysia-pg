import { db } from "@/db"
import { spatialMaps } from "@/db/schema"
import { ulid } from "ulid"

export const runSpatialMapsSeed = async () => {
	try {
		console.log("🗺️  Starting spatial maps seeding...")

		// Get first organization from database for seeding
		const orgsResult = await db.query.organizations.findFirst()
		const usersResult = await db.query.users.findFirst()

		if (!orgsResult || !usersResult) {
			console.log("⚠️  No organization or user found, skipping spatial maps seed")
			return
		}

		const indonesiaMaps = [
			{
				id: ulid(),
				userId: usersResult.id,
				organizationId: orgsResult.id,
				name: "Peta Indonesia",
				description: "Peta utama Indonesia dengan pusat di Jakarta",
				centerLat: -6.2088,
				centerLng: 106.8456,
				defaultZoom: 5,
				baseMap: "osm",
				projection: "EPSG:4326",
				settings: {
					showScale: true,
					showAttribution: true,
					enableZoomControl: true,
				},
				status: "active",
				visibility: "public",
				tags: "indonesia,nasional,utama",
			},
			{
				id: ulid(),
				userId: usersResult.id,
				organizationId: orgsResult.id,
				name: "Peta Jawa",
				description: "Peta Pulau Jawa dan sekitarnya",
				centerLat: -7.7956,
				centerLng: 110.3695,
				defaultZoom: 7,
				baseMap: "satellite",
				projection: "EPSG:4326",
				settings: {
					showScale: true,
					showAttribution: true,
				},
				status: "active",
				visibility: "public",
				tags: "jawa,regional",
			},
			{
				id: ulid(),
				userId: usersResult.id,
				organizationId: orgsResult.id,
				name: "Peta Sumatera",
				description: "Peta Pulau Sumatera",
				centerLat: -0.7893,
				centerLng: 101.0,
				defaultZoom: 6,
				baseMap: "terrain",
				projection: "EPSG:4326",
				settings: {
					showScale: true,
				},
				status: "active",
				visibility: "public",
				tags: "sumatera,regional",
			},
		]

		for (const mapData of indonesiaMaps) {
			await db.insert(spatialMaps).values(mapData)
			console.log(`✅ Spatial map created: ${mapData.name}`)
		}

		console.log("✅ Spatial maps seeding completed!")
	} catch (error) {
		console.error("❌ Error seeding spatial maps:", error)
		throw error
	}
}
