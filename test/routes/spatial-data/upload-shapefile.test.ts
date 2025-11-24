import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { db } from "@/db"
import { spatialData } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { ErrorMessage } from "@/common/enum/response-message"
import { config } from "@/app/config"
import { SpatialDataPermission } from "@/common/enum/permissions"
import { createTestUser, cleanupTestUser, loginTestUser } from "@/test/helpers/test-setup"
import {
	createMockShapefileZip,
	createInvalidShapefileZip,
} from "@/test/fixtures/shapefile-mocks"

const API_URL = `${config.API_URL}:${config.PORT}`

interface UploadShapefileResponse {
	status: boolean
	message: string
	data?: {
		totalFeatures: number
		successCount: number
		skipCount: number
		insertedRecords: number
		fileName: string
		crs?: string
	}
}

describe("POST /spatial-data/upload-shapefile", () => {
	let accessToken: string
	let testSetup: {
		userId: string
		organizationId: string
		email: string
		password: string
	}
	let createdSpatialDataIds: string[] = []

	beforeAll(async () => {
		// NOTE: Get the CREATE_SPATIAL_DATA permission ID
		const createPermission = await db.query.permissions.findFirst({
			where: (table, { eq }) =>
				eq(table.name, SpatialDataPermission.CREATE_SPATIAL_DATA),
		})

		if (!createPermission) {
			throw new Error(
				"CREATE_SPATIAL_DATA permission not found. Please run seeds first.",
			)
		}

		// NOTE: Create test user with spatial data permission
		testSetup = await createTestUser({
			email: "shapefile-test@test.com",
			password: "password123",
			permissionIds: [createPermission.id],
		})

		// NOTE: Login to get access token
		accessToken = await loginTestUser(
			testSetup.email,
			testSetup.password,
			API_URL,
		)
	})

	it("should return unauthorized when no token provided", async () => {
		const mockZip = await createMockShapefileZip()
		const formData = new FormData()
		formData.append("file", new Blob([mockZip]), "test.zip")

		const response = await fetch(`${API_URL}/spatial-data/upload-shapefile`, {
			method: "POST",
			body: formData,
		})

		const json = (await response.json()) as UploadShapefileResponse
		expect(json.status).toBe(false)
		expect(json.message).toBe(ErrorMessage.UNAUTHORIZED)
	})

	it("should return error when no file provided", async () => {
		const formData = new FormData()

		const response = await fetch(`${API_URL}/spatial-data/upload-shapefile`, {
			method: "POST",
			body: formData,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		expect(response.status).toBe(400)
	})

	it("should return error when invalid ZIP provided (no .shp file)", async () => {
		const invalidZip = await createInvalidShapefileZip()
		const formData = new FormData()
		formData.append("file", new Blob([invalidZip]), "invalid.zip")

		const response = await fetch(`${API_URL}/spatial-data/upload-shapefile`, {
			method: "POST",
			body: formData,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		const json = (await response.json()) as UploadShapefileResponse
		expect(json.status).toBe(false)
		expect(json.message).toContain("No .shp file found")
	})

	it("should successfully upload and parse a valid shapefile", async () => {
		const mockZip = await createMockShapefileZip()
		const formData = new FormData()
		formData.append(
			"file",
			new Blob([mockZip], { type: "application/zip" }),
			"test.zip",
		)
		formData.append("defaultStatus", "active")
		formData.append("defaultVisibility", "public")
		formData.append("tags", "test,imported")

		const response = await fetch(`${API_URL}/spatial-data/upload-shapefile`, {
			method: "POST",
			body: formData,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		const json = (await response.json()) as UploadShapefileResponse

		expect(response.status).toBe(201)
		expect(json.status).toBe(true)
		expect(json.message).toBe("Shapefile uploaded and processed successfully")
		expect(json.data).toBeDefined()
		expect(json.data?.totalFeatures).toBeGreaterThan(0)
		expect(json.data?.successCount).toBeGreaterThan(0)
		expect(json.data?.insertedRecords).toBeGreaterThan(0)
		expect(json.data?.fileName).toBe("test.zip")

		// NOTE: Verify data was inserted into database
		const insertedData = await db.query.spatialData.findMany({
			where: (table, { eq }) => eq(table.organizationId, testSetup.organizationId),
		})

		expect(insertedData.length).toBeGreaterThan(0)

		// NOTE: Store IDs for cleanup
		createdSpatialDataIds = insertedData.map((data) => data.id)

		// NOTE: Verify PostGIS geometry was created correctly
		const firstRecord = insertedData[0]
		expect(firstRecord.name).toBeDefined()
		expect(firstRecord.dataType).toBe("point")
		expect(firstRecord.status).toBe("active")
		expect(firstRecord.visibility).toBe("public")
		expect(firstRecord.tags).toBe("test,imported")

		// NOTE: Verify geometry data by extracting lat/lng
		const geometryCheck = await db.execute(sql`
			SELECT
				ST_X(geometry) as longitude,
				ST_Y(geometry) as latitude
			FROM spatial_data
			WHERE id = ${firstRecord.id}
		`)

		const coords = geometryCheck.rows[0] as {
			longitude: number
			latitude: number
		}
		expect(coords.longitude).toBeCloseTo(106.8456, 4)
		expect(coords.latitude).toBeCloseTo(-6.2088, 4)
	})

	it("should handle shapefile with optional layerId", async () => {
		// NOTE: Create a test layer first
		const { spatialLayers } = await import("@/db/schema")
		const { ulid } = await import("ulid")

		const layerId = ulid()
		await db.insert(spatialLayers).values({
			id: layerId,
			userId: testSetup.userId,
			organizationId: testSetup.organizationId,
			name: "Test Layer",
			layerType: "vector",
		})

		const mockZip = await createMockShapefileZip()
		const formData = new FormData()
		formData.append(
			"file",
			new Blob([mockZip], { type: "application/zip" }),
			"test-with-layer.zip",
		)
		formData.append("layerId", layerId)

		const response = await fetch(`${API_URL}/spatial-data/upload-shapefile`, {
			method: "POST",
			body: formData,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		const json = (await response.json()) as UploadShapefileResponse

		expect(response.status).toBe(201)
		expect(json.status).toBe(true)

		// NOTE: Verify layerId was set
		const insertedData = await db.query.spatialData.findFirst({
			where: (table, { eq }) =>
				and(
					eq(table.organizationId, testSetup.organizationId),
					eq(table.layerId, layerId),
				),
		})

		expect(insertedData).toBeDefined()
		expect(insertedData?.layerId).toBe(layerId)

		// NOTE: Store IDs for cleanup
		if (insertedData) {
			createdSpatialDataIds.push(insertedData.id)
		}

		// NOTE: Clean up test layer
		await db.delete(spatialLayers).where(eq(spatialLayers.id, layerId))
	})

	it("should handle empty shapefile gracefully", async () => {
		// NOTE: Create a ZIP with empty shapefile
		const JSZip = (await import("jszip")).default
		const zip = new JSZip()

		// Minimal empty .shp file (header only)
		const emptyShp = Buffer.alloc(100)
		emptyShp.writeInt32BE(9994, 0)
		emptyShp.writeInt32BE(50, 24) // File length (header only)
		emptyShp.writeInt32LE(1000, 28)
		emptyShp.writeInt32LE(1, 32) // Point type

		zip.file("empty.shp", emptyShp)

		const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })

		const formData = new FormData()
		formData.append(
			"file",
			new Blob([zipBuffer], { type: "application/zip" }),
			"empty.zip",
		)

		const response = await fetch(`${API_URL}/spatial-data/upload-shapefile`, {
			method: "POST",
			body: formData,
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		})

		const json = (await response.json()) as UploadShapefileResponse

		// NOTE: Should succeed but with 0 records
		expect(json.status).toBe(true)
		expect(json.data?.insertedRecords).toBe(0)
	})

	afterAll(async () => {
		// NOTE: Clean up created spatial data
		if (createdSpatialDataIds.length > 0) {
			for (const id of createdSpatialDataIds) {
				await db.delete(spatialData).where(eq(spatialData.id, id))
			}
		}

		// NOTE: Clean up all spatial data for test organization
		await db
			.delete(spatialData)
			.where(eq(spatialData.organizationId, testSetup.organizationId))

		// NOTE: Clean up test user
		await cleanupTestUser(testSetup.userId, testSetup.organizationId)
	})
})
