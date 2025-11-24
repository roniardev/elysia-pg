import { db } from "@/db"
import { spatialData } from "@/db/schema"
import { ulid } from "ulid"
import { sql } from "drizzle-orm"

export const runSpatialDataSeed = async () => {
	try {
		console.log("🌏 Starting spatial data seeding...")

		// Get first organization, user, and layer from database for seeding
		const orgsResult = await db.query.organizations.findFirst()
		const usersResult = await db.query.users.findFirst()
		const layerResult = await db.query.spatialLayers.findFirst()

		if (!orgsResult || !usersResult) {
			console.log(
				"⚠️  No organization or user found, skipping spatial data seed",
			)
			return
		}

		// Indonesian provincial capitals and major cities
		const indonesianLocations = [
			{
				name: "Jakarta",
				description: "Ibu kota Indonesia dan provinsi DKI Jakarta",
				latitude: -6.2088,
				longitude: 106.8456,
				properties: {
					type: "capital",
					province: "DKI Jakarta",
					population: 10562088,
				},
				tags: "ibu-kota,provinsi,jakarta",
			},
			{
				name: "Surabaya",
				description: "Ibu kota Provinsi Jawa Timur",
				latitude: -7.2575,
				longitude: 112.7521,
				properties: {
					type: "capital",
					province: "Jawa Timur",
					population: 2874314,
				},
				tags: "ibu-kota,provinsi,surabaya",
			},
			{
				name: "Bandung",
				description: "Ibu kota Provinsi Jawa Barat",
				latitude: -6.9175,
				longitude: 107.6191,
				properties: {
					type: "capital",
					province: "Jawa Barat",
					population: 2444160,
				},
				tags: "ibu-kota,provinsi,bandung",
			},
			{
				name: "Medan",
				description: "Ibu kota Provinsi Sumatera Utara",
				latitude: 3.5952,
				longitude: 98.6722,
				properties: {
					type: "capital",
					province: "Sumatera Utara",
					population: 2435252,
				},
				tags: "ibu-kota,provinsi,medan",
			},
			{
				name: "Semarang",
				description: "Ibu kota Provinsi Jawa Tengah",
				latitude: -6.9932,
				longitude: 110.4203,
				properties: {
					type: "capital",
					province: "Jawa Tengah",
					population: 1653524,
				},
				tags: "ibu-kota,provinsi,semarang",
			},
			{
				name: "Makassar",
				description: "Ibu kota Provinsi Sulawesi Selatan",
				latitude: -5.1477,
				longitude: 119.4327,
				properties: {
					type: "capital",
					province: "Sulawesi Selatan",
					population: 1423877,
				},
				tags: "ibu-kota,provinsi,makassar",
			},
			{
				name: "Palembang",
				description: "Ibu kota Provinsi Sumatera Selatan",
				latitude: -2.9761,
				longitude: 104.7754,
				properties: {
					type: "capital",
					province: "Sumatera Selatan",
					population: 1668848,
				},
				tags: "ibu-kota,provinsi,palembang",
			},
			{
				name: "Denpasar",
				description: "Ibu kota Provinsi Bali",
				latitude: -8.6705,
				longitude: 115.2126,
				properties: {
					type: "capital",
					province: "Bali",
					population: 897389,
				},
				tags: "ibu-kota,provinsi,bali,denpasar",
			},
			{
				name: "Yogyakarta",
				description: "Ibu kota Daerah Istimewa Yogyakarta",
				latitude: -7.7956,
				longitude: 110.3695,
				properties: {
					type: "capital",
					province: "DI Yogyakarta",
					population: 422732,
					special: "Daerah Istimewa",
				},
				tags: "ibu-kota,provinsi,yogyakarta",
			},
			{
				name: "Manado",
				description: "Ibu kota Provinsi Sulawesi Utara",
				latitude: 1.4748,
				longitude: 124.8421,
				properties: {
					type: "capital",
					province: "Sulawesi Utara",
					population: 451916,
				},
				tags: "ibu-kota,provinsi,manado",
			},
			{
				name: "Bandar Lampung",
				description: "Ibu kota Provinsi Lampung",
				latitude: -5.4292,
				longitude: 105.2625,
				properties: {
					type: "capital",
					province: "Lampung",
					population: 1166066,
				},
				tags: "ibu-kota,provinsi,lampung",
			},
			{
				name: "Pontianak",
				description: "Ibu kota Provinsi Kalimantan Barat",
				latitude: -0.0263,
				longitude: 109.3425,
				properties: {
					type: "capital",
					province: "Kalimantan Barat",
					population: 658685,
				},
				tags: "ibu-kota,provinsi,pontianak",
			},
			{
				name: "Balikpapan",
				description: "Kota besar di Kalimantan Timur",
				latitude: -1.2379,
				longitude: 116.8529,
				properties: {
					type: "city",
					province: "Kalimantan Timur",
					population: 688318,
				},
				tags: "kota,kalimantan",
			},
			{
				name: "Padang",
				description: "Ibu kota Provinsi Sumatera Barat",
				latitude: -0.9471,
				longitude: 100.4172,
				properties: {
					type: "capital",
					province: "Sumatera Barat",
					population: 927168,
				},
				tags: "ibu-kota,provinsi,padang",
			},
			{
				name: "Malang",
				description: "Kota besar di Jawa Timur",
				latitude: -7.9666,
				longitude: 112.6326,
				properties: {
					type: "city",
					province: "Jawa Timur",
					population: 843810,
				},
				tags: "kota,jawa-timur,malang",
			},
		]

		for (const location of indonesianLocations) {
			const id = ulid()
			await db.insert(spatialData).values({
				id,
				userId: usersResult.id,
				organizationId: orgsResult.id,
				layerId: layerResult?.id,
				name: location.name,
				description: location.description,
				geometry: sql`ST_SetSRID(ST_MakePoint(${location.longitude}, ${location.latitude}), 4326)`,
				properties: location.properties,
				dataType: "point",
				status: "active",
				visibility: "public",
				tags: location.tags,
			})
			console.log(`✅ Spatial data created: ${location.name}`)
		}

		console.log("✅ Spatial data seeding completed!")
	} catch (error) {
		console.error("❌ Error seeding spatial data:", error)
		throw error
	}
}
