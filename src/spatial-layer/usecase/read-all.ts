import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq, and, ilike, desc, asc, or, sql } from "drizzle-orm"

import { SpatialLayerPermission } from "@/common/enum/permissions"
import { ErrorMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { spatialLayers } from "@/db/schema"
import { getUser } from "@/src/general/usecase/get-user"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { readAllSpatialLayerModel } from "../data/spatial-layer.model"
import Sorting from "@/common/enum/sorting"

export const readAllSpatialLayer = new Elysia()
	.use(readAllSpatialLayerModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/spatial-layer",
		async ({ query, bearer, set, jwtAccess }) => {
			const path = "spatial-layer.read-all.usecase"
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
				SpatialLayerPermission.READ_ALL_SPATIAL_LAYER,
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

			const { page, limit, sort, search, mapId } = query
			const offset = (page - 1) * limit

			try {
				const conditions = [eq(spatialLayers.organizationId, organizationId)]

				if (search) {
					conditions.push(
						or(
							ilike(spatialLayers.name, `%${search}%`),
							ilike(spatialLayers.description, `%${search}%`),
						)!,
					)
				}

				if (mapId) {
					conditions.push(eq(spatialLayers.mapId, mapId))
				}

				const data = await db
					.select()
					.from(spatialLayers)
					.where(and(...conditions))
					.orderBy(
						sort === Sorting.ASC
							? asc(spatialLayers.createdAt)
							: desc(spatialLayers.createdAt),
					)
					.limit(limit)
					.offset(offset)

				const total = await db
					.select({ count: sql<number>`count(*)` })
					.from(spatialLayers)
					.where(and(...conditions))

				return handleResponse({
					message: "Spatial layers retrieved successfully",
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
			query: "readAllSpatialLayerModel",
		},
	)
