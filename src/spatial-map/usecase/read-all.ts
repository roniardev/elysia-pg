import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq, and, ilike, desc, asc, or, sql } from "drizzle-orm"

import { SpatialMapPermission } from "@/common/enum/permissions"
import { ErrorMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { spatialMaps } from "@/db/schema"
import { getUser } from "@/src/general/usecase/get-user"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { readAllSpatialMapModel } from "../data/spatial-map.model"
import Sorting from "@/common/enum/sorting"

export const readAllSpatialMap = new Elysia()
	.use(readAllSpatialMapModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/spatial-map",
		async ({ query, bearer, set, jwtAccess }) => {
			const path = "spatial-map.read-all.usecase"
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
				SpatialMapPermission.READ_ALL_SPATIAL_MAP,
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

			const { page, limit, sort, search } = query
			const offset = (page - 1) * limit

			try {
				const conditions = [eq(spatialMaps.organizationId, organizationId)]

				if (search) {
					conditions.push(
						or(
							ilike(spatialMaps.name, `%${search}%`),
							ilike(spatialMaps.description, `%${search}%`),
						)!,
					)
				}

				const data = await db
					.select()
					.from(spatialMaps)
					.where(and(...conditions))
					.orderBy(
						sort === Sorting.ASC
							? asc(spatialMaps.createdAt)
							: desc(spatialMaps.createdAt),
					)
					.limit(limit)
					.offset(offset)

				const total = await db
					.select({ count: sql<number>`count(*)` })
					.from(spatialMaps)
					.where(and(...conditions))

				return handleResponse({
					message: "Spatial maps retrieved successfully",
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
			query: "readAllSpatialMapModel",
		},
	)
