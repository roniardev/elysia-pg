import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq, and, ilike, desc, asc, or, sql } from "drizzle-orm"

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
import { readAllSpatialDataModel } from "../data/spatial-data.model"
import Sorting from "@/common/enum/sorting"

export const readAllSpatialData = new Elysia()
	.use(readAllSpatialDataModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/spatial-data",
		async ({ query, bearer, set, jwtAccess }) => {
			const path = "spatial-data.read-all.usecase"
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
				SpatialDataPermission.READ_ALL_SPATIAL_DATA,
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

			const { page, limit, sort, search, layerId } = query
			const offset = (page - 1) * limit

			try {
				const conditions = [eq(spatialData.organizationId, organizationId)]

				if (search) {
					conditions.push(
						or(
							ilike(spatialData.name, `%${search}%`),
							ilike(spatialData.description, `%${search}%`),
						)!,
					)
				}

				if (layerId) {
					conditions.push(eq(spatialData.layerId, layerId))
				}

				const data = await db
					.select({
						id: spatialData.id,
						layerId: spatialData.layerId,
						name: spatialData.name,
						description: spatialData.description,
						latitude: sql<number>`ST_Y(geometry)`,
						longitude: sql<number>`ST_X(geometry)`,
						properties: spatialData.properties,
						dataType: spatialData.dataType,
						status: spatialData.status,
						visibility: spatialData.visibility,
						tags: spatialData.tags,
						createdAt: spatialData.createdAt,
						updatedAt: spatialData.updatedAt,
					})
					.from(spatialData)
					.where(and(...conditions))
					.orderBy(
						sort === Sorting.ASC
							? asc(spatialData.createdAt)
							: desc(spatialData.createdAt),
					)
					.limit(limit)
					.offset(offset)

				const total = await db
					.select({ count: sql<number>`count(*)` })
					.from(spatialData)
					.where(and(...conditions))

				return handleResponse({
					message: "Spatial data retrieved successfully",
					callback: () => {
						set.status = ResponseSuccessStatus.SUCCESS
					},
					data: {
						items: data,
						pagination: {
							page,
							limit,
							total: total[0].count,
							totalPages: Math.ceil(total[0].count / limit),
						},
					},
					path,
				})
			} catch (error) {
				console.error(error)
				return handleResponse({
					message: ErrorMessage.INTERNAL_SERVER_ERROR,
					callback: () => {
						set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
					},
					path,
				})
			}
		},
		{
			query: "readAllSpatialDataModel",
		},
	)
