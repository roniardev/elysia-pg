import bearer from "@elysiajs/bearer"
import { Elysia, t } from "elysia"
import { ulid } from "ulid"
import { sql } from "drizzle-orm"

import { SpatialDataPermission } from "@/common/enum/permissions"
import { ErrorMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { spatialData } from "@/db/schema"
import { getUser } from "@/src/general/usecase/get-user"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import {
	parseShapefile,
	extractCoordinates,
	getDataType,
	isValidCoordinates,
} from "@/utils/spatial/shapefile-parser"

export const uploadShapefile = new Elysia()
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/spatial-data/upload-shapefile",
		async ({ body, bearer, set, jwtAccess }) => {
			const path = "spatial-data.upload-shapefile.usecase"
			const validToken = await jwtAccess.verify(bearer)

			if (!validToken) {
				return handleResponse({
					message: ErrorMessage.UNAUTHORIZED,
					callback: () => {
						set.status = ResponseErrorStatus.FORBIDDEN
					},
					path,
				})
			}

			// CHECK EXISTING USER
			const existingUser = await getUser({
				identifier: validToken.id,
				type: "id",
				condition: {
					deleted: false,
				},
			})

			if (!existingUser.user) {
				return handleResponse({
					message: ErrorMessage.INVALID_USER,
					callback: () => {
						set.status = ResponseErrorStatus.BAD_REQUEST
					},
					path,
				})
			}

			const { valid } = await verifyPermission(
				SpatialDataPermission.CREATE_SPATIAL_DATA,
				existingUser.user?.id,
			)

			if (!valid) {
				return handleResponse({
					message: ErrorMessage.UNAUTHORIZED_PERMISSION,
					callback: () => {
						set.status = ResponseErrorStatus.FORBIDDEN
					},
					path,
				})
			}

			const organizationId = validToken.organizationId

			if (!organizationId) {
				return handleResponse({
					message: "Organization context required",
					callback: () => {
						set.status = ResponseErrorStatus.BAD_REQUEST
					},
					path,
				})
			}

			// Validate file
			if (!body.file) {
				return handleResponse({
					message: "File is required",
					callback: () => {
						set.status = ResponseErrorStatus.BAD_REQUEST
					},
					path,
				})
			}

			try {
				// Convert file to buffer
				const fileBuffer = Buffer.from(await body.file.arrayBuffer())
				const fileName = body.file.name

				// Parse shapefile
				console.log(`📂 Parsing shapefile: ${fileName}`)
				const parsedData = await parseShapefile(fileBuffer, fileName)

				console.log(
					`✅ Found ${parsedData.totalFeatures} features in shapefile`,
				)

				// Prepare bulk insert data
				const spatialDataRecords = []
				let successCount = 0
				let skipCount = 0

				for (const feature of parsedData.features) {
					try {
						const coords = extractCoordinates(feature.geometry)

						if (!coords) {
							console.warn(
								`⚠️  Skipping feature: Unable to extract coordinates from ${feature.geometry.type}`,
							)
							skipCount++
							continue
						}

						if (!isValidCoordinates(coords.longitude, coords.latitude)) {
							console.warn(
								`⚠️  Skipping feature: Invalid coordinates [${coords.longitude}, ${coords.latitude}]`,
							)
							skipCount++
							continue
						}

						// Generate name from properties or use default
						const name =
							feature.properties?.name ||
							feature.properties?.NAME ||
							feature.properties?.title ||
							feature.properties?.TITLE ||
							`Feature ${successCount + 1}`

						const description =
							feature.properties?.description ||
							feature.properties?.DESCRIPTION ||
							null

						const dataType = getDataType(feature.geometry.type)

						spatialDataRecords.push({
							id: ulid(),
							userId: existingUser.user?.id,
							organizationId: organizationId,
							layerId: body.layerId || null,
							name: name,
							description: description,
							geometry: sql`ST_SetSRID(ST_MakePoint(${coords.longitude}, ${coords.latitude}), 4326)`,
							properties: feature.properties,
							dataType: dataType,
							status: body.defaultStatus || "active",
							visibility: body.defaultVisibility || "private",
							tags: body.tags || null,
						})

						successCount++
					} catch (featureError) {
						console.error("Error processing feature:", featureError)
						skipCount++
					}
				}

				// Bulk insert to database
				if (spatialDataRecords.length > 0) {
					console.log(`💾 Inserting ${spatialDataRecords.length} records...`)
					await db.insert(spatialData).values(spatialDataRecords)
				}

				return handleResponse({
					message: "Shapefile uploaded and processed successfully",
					callback: () => {
						set.status = ResponseSuccessStatus.CREATED
					},
					data: {
						totalFeatures: parsedData.totalFeatures,
						successCount,
						skipCount,
						insertedRecords: spatialDataRecords.length,
						fileName: fileName,
						crs: parsedData.crs,
					},
					path,
				})
			} catch (error) {
				console.error("Error processing shapefile:", error)
				return handleResponse({
					message:
						error instanceof Error
							? error.message
							: ErrorMessage.INTERNAL_SERVER_ERROR,
					callback: () => {
						set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
					},
					path,
				})
			}
		},
		{
			body: t.Object({
				file: t.File({
					type: ["application/zip", "application/x-zip-compressed"],
					maxSize: 50 * 1024 * 1024, // 50MB max
				}),
				layerId: t.Optional(t.String()),
				defaultStatus: t.Optional(
					t.Union([t.Literal("active"), t.Literal("inactive")]),
				),
				defaultVisibility: t.Optional(
					t.Union([t.Literal("public"), t.Literal("private")]),
				),
				tags: t.Optional(t.String()),
			}),
		},
	)
