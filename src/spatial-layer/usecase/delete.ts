import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq, and } from "drizzle-orm"

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
import { deleteSpatialLayerModel } from "../data/spatial-layer.model"

export const deleteSpatialLayer = new Elysia()
	.use(deleteSpatialLayerModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.delete(
		"/spatial-layer/:id",
		async ({ params, bearer, set, jwtAccess }) => {
			const path = "spatial-layer.delete.usecase"
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
				SpatialLayerPermission.DELETE_SPATIAL_LAYER,
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
					.from(spatialLayers)
					.where(
						and(
							eq(spatialLayers.id, params.id),
							eq(spatialLayers.organizationId, organizationId),
						),
					)

				if (existingData.length === 0) {
					return handleResponse({
						message: "Spatial layer not found",
						callback: () => {
							set.status = ResponseErrorStatus.NOT_FOUND
						},
						path,
					})
				}

				// Soft delete
				await db
					.update(spatialLayers)
					.set({ deletedAt: new Date() })
					.where(
						and(
							eq(spatialLayers.id, params.id),
							eq(spatialLayers.organizationId, organizationId),
						),
					)

				return handleResponse({
					message: "Spatial layer deleted successfully",
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
			params: "deleteSpatialLayerModel",
		},
	)
