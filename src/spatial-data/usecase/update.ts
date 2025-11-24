import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { eq, and, sql } from "drizzle-orm"

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
import { updateSpatialDataModel } from "../data/spatial-data.model"

export const updateSpatialData = new Elysia()
	.use(updateSpatialDataModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.patch(
		"/spatial-data/:id",
		async ({ params, body, bearer, set, jwtAccess }) => {
			const path = "spatial-data.update.usecase"
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
				SpatialDataPermission.UPDATE_SPATIAL_DATA,
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
				// Check if spatial data exists
				const existingData = await db
					.select()
					.from(spatialData)
					.where(
						and(
							eq(spatialData.id, params.id),
							eq(spatialData.organizationId, organizationId),
						),
					)

				if (existingData.length === 0) {
					return handleResponse({
						message: "Spatial data not found",
						callback: () => {
							set.status = ResponseErrorStatus.NOT_FOUND
						},
						path,
					})
				}

				// Build update object
				const updateData: any = {}

				if (body.layerId !== undefined) updateData.layerId = body.layerId
				if (body.name !== undefined) updateData.name = body.name
				if (body.description !== undefined)
					updateData.description = body.description
				if (body.properties !== undefined)
					updateData.properties = body.properties
				if (body.dataType !== undefined) updateData.dataType = body.dataType
				if (body.status !== undefined) updateData.status = body.status
				if (body.visibility !== undefined)
					updateData.visibility = body.visibility
				if (body.tags !== undefined) updateData.tags = body.tags

				// Update geometry if lat/lng provided
				if (body.latitude !== undefined && body.longitude !== undefined) {
					updateData.geometry = sql`ST_SetSRID(ST_MakePoint(${body.longitude}, ${body.latitude}), 4326)`
				}

				await db
					.update(spatialData)
					.set(updateData)
					.where(
						and(
							eq(spatialData.id, params.id),
							eq(spatialData.organizationId, organizationId),
						),
					)

				return handleResponse({
					message: "Spatial data updated successfully",
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
			body: "updateSpatialDataModel",
		},
	)
