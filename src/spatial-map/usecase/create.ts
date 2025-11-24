import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { ulid } from "ulid"

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
import { createSpatialMapModel } from "../data/spatial-map.model"

export const createSpatialMap = new Elysia()
	.use(createSpatialMapModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/spatial-map",
		async ({ body, bearer, set, jwtAccess }) => {
			const path = "spatial-map.create.usecase"
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
				SpatialMapPermission.CREATE_SPATIAL_MAP,
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

			const spatialMapId = ulid()
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
				await db.insert(spatialMaps).values({
					id: spatialMapId,
					userId: existingUser.user?.id,
					organizationId: organizationId,
					name: body.name,
					description: body.description,
					centerLat: body.centerLat || 0,
					centerLng: body.centerLng || 0,
					defaultZoom: body.defaultZoom || 10,
					baseMap: body.baseMap || "osm",
					projection: body.projection || "EPSG:4326",
					settings: body.settings,
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
				id: spatialMapId,
				name: body.name,
				baseMap: body.baseMap || "osm",
			}

			return handleResponse({
				message: "Spatial map created successfully",
				callback: () => {
					set.status = ResponseSuccessStatus.CREATED
				},
				data: response,
				path,
			})
		},
		{
			body: "createSpatialMapModel",
		},
	)
