import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq, and } from "drizzle-orm"

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
import { deleteSpatialMapModel } from "../data/spatial-map.model"

export const deleteSpatialMap = new Elysia()
	.use(deleteSpatialMapModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.delete(
		"/spatial-map/:id",
		async ({ params, bearer, set, jwtAccess }) => {
			const path = "spatial-map.delete.usecase"
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
				SpatialMapPermission.DELETE_SPATIAL_MAP,
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

			try {
				const existingData = await db
					.select()
					.from(spatialMaps)
					.where(
						and(
							eq(spatialMaps.id, params.id),
							eq(spatialMaps.organizationId, organizationId),
						),
					)

				if (existingData.length === 0) {
					return handleResponse({
						message: "Spatial map not found",
						callback: () => {
							set.status = ResponseErrorStatus.NOT_FOUND
						},
						path,
					})
				}

				// Soft delete
				await db
					.update(spatialMaps)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(spatialMaps.id, params.id),
							eq(spatialMaps.organizationId, organizationId),
						),
					)

				return handleResponse({
					message: "Spatial map deleted successfully",
					callback: () => {
						set.status = ResponseSuccessStatus.SUCCESS
					},
					data: { id: params.id },
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
			params: "deleteSpatialMapModel",
		},
	)
