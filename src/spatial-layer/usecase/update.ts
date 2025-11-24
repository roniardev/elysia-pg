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
import { updateSpatialLayerModel } from "../data/spatial-layer.model"

export const updateSpatialLayer = new Elysia()
	.use(updateSpatialLayerModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.patch(
		"/spatial-layer/:id",
		async ({ params, body, bearer, set, jwtAccess }) => {
			const path = "spatial-layer.update.usecase"
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
				SpatialLayerPermission.UPDATE_SPATIAL_LAYER,
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

				const updateData: any = {}

				if (body.mapId !== undefined) updateData.mapId = body.mapId
				if (body.name !== undefined) updateData.name = body.name
				if (body.description !== undefined)
					updateData.description = body.description
				if (body.layerType !== undefined) updateData.layerType = body.layerType
				if (body.style !== undefined) updateData.style = body.style
				if (body.minZoom !== undefined) updateData.minZoom = body.minZoom
				if (body.maxZoom !== undefined) updateData.maxZoom = body.maxZoom
				if (body.opacity !== undefined) updateData.opacity = body.opacity
				if (body.isVisible !== undefined) updateData.isVisible = body.isVisible
				if (body.zIndex !== undefined) updateData.zIndex = body.zIndex
				if (body.status !== undefined) updateData.status = body.status
				if (body.visibility !== undefined)
					updateData.visibility = body.visibility
				if (body.tags !== undefined) updateData.tags = body.tags

				await db
					.update(spatialLayers)
					.set(updateData)
					.where(
						and(
							eq(spatialLayers.id, params.id),
							eq(spatialLayers.organizationId, organizationId),
						),
					)

				return handleResponse({
					message: "Spatial layer updated successfully",
					callback: () => {
						set.status = ResponseSuccessStatus.SUCCESS
					},
					data: { id: params.id, ...updateData },
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
			body: "updateSpatialLayerModel",
		},
	)
