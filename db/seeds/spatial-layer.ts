import { db } from "@/db"
import { spatialLayers } from "@/db/schema"
import { ulid } from "ulid"

export const runSpatialLayersSeed = async () => {
	try {
		console.log("📍 Starting spatial layers seeding...")

		// Get first organization and user from database for seeding
		const orgsResult = await db.query.organizations.findFirst()
		const usersResult = await db.query.users.findFirst()
		const mapsResult = await db.query.spatialMaps.findFirst()

		if (!orgsResult || !usersResult || !mapsResult) {
			console.log(
				"⚠️  No organization, user, or map found, skipping spatial layers seed",
			)
			return
		}

		const indonesiaLayers = [
			{
				id: ulid(),
				userId: usersResult.id,
				organizationId: orgsResult.id,
				mapId: mapsResult.id,
				name: "Ibu Kota Provinsi",
				description: "Layer menampilkan lokasi ibu kota provinsi di Indonesia",
				layerType: "vector",
				style: {
					color: "#FF0000",
					size: 8,
					icon: "circle",
				},
				minZoom: 5,
				maxZoom: 18,
				opacity: 100,
				isVisible: "true",
				zIndex: 10,
				status: "active",
				visibility: "public",
				tags: "provinsi,ibu-kota",
			},
			{
				id: ulid(),
				userId: usersResult.id,
				organizationId: orgsResult.id,
				mapId: mapsResult.id,
				name: "Kota Besar",
				description: "Layer kota-kota besar di Indonesia",
				layerType: "vector",
				style: {
					color: "#0000FF",
					size: 6,
					icon: "square",
				},
				minZoom: 6,
				maxZoom: 18,
				opacity: 90,
				isVisible: "true",
				zIndex: 9,
				status: "active",
				visibility: "public",
				tags: "kota,urban",
			},
			{
				id: ulid(),
				userId: usersResult.id,
				organizationId: orgsResult.id,
				mapId: mapsResult.id,
				name: "Tempat Wisata",
				description: "Layer lokasi tempat wisata populer",
				layerType: "vector",
				style: {
					color: "#00FF00",
					size: 5,
					icon: "star",
				},
				minZoom: 7,
				maxZoom: 18,
				opacity: 85,
				isVisible: "true",
				zIndex: 8,
				status: "active",
				visibility: "public",
				tags: "wisata,tourism",
			},
		]

		for (const layerData of indonesiaLayers) {
			await db.insert(spatialLayers).values(layerData)
			console.log(`✅ Spatial layer created: ${layerData.name}`)
		}

		console.log("✅ Spatial layers seeding completed!")
	} catch (error) {
		console.error("❌ Error seeding spatial layers:", error)
		throw error
	}
}
