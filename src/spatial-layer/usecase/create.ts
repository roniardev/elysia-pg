import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { ulid } from "ulid"

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
import { createSpatialLayerModel } from "../data/spatial-layer.model"

export const createSpatialLayer = new Elysia()
	.use(createSpatialLayerModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/spatial-layer",
		async ({ body, bearer, set, jwtAccess }) => {
			const path = "spatial-layer.create.usecase"
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
				SpatialLayerPermission.CREATE_SPATIAL_LAYER,
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

			const spatialLayerId = ulid()
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
				await db.insert(spatialLayers).values({
					id: spatialLayerId,
					userId: existingUser.user?.id,
					organizationId: organizationId,
					mapId: body.mapId,
					name: body.name,
					description: body.description,
					layerType: body.layerType || "vector",
					style: body.style,
					minZoom: body.minZoom || 0,
					maxZoom: body.maxZoom || 22,
					opacity: body.opacity || 100,
					isVisible: body.isVisible || "true",
					zIndex: body.zIndex || 0,
					status: body.status || "active",
					visibility: body.visibility || "private",
					tags: body.tags,
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

			const response = {
				id: spatialLayerId,
				name: body.name,
				layerType: body.layerType || "vector",
			}

			return handleResponse({
				message: "Spatial layer created successfully",
				callback: () => {
					set.status = ResponseSuccessStatus.CREATED
				},
				data: response,
				path,
			})
		},
		{
			body: "createSpatialLayerModel",
		},
	)
