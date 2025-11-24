import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { ulid } from "ulid"
import { sql } from "drizzle-orm"

import { SpatialDataPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
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
import { createSpatialDataModel } from "../data/spatial-data.model"

export const createSpatialData = new Elysia()
	.use(createSpatialDataModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/spatial-data",
		async ({ body, bearer, set, jwtAccess }) => {
			const path = "spatial-data.create.usecase"
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

			// CREATE SPATIAL DATA
			const spatialDataId = ulid()
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
				// Convert lat/lng to PostGIS geometry Point
				await db.insert(spatialData).values({
					id: spatialDataId,
					userId: existingUser.user?.id,
					organizationId: organizationId,
					layerId: body.layerId,
					name: body.name,
					description: body.description,
					geometry: sql`ST_SetSRID(ST_MakePoint(${body.longitude}, ${body.latitude}), 4326)`,
					properties: body.properties,
					dataType: body.dataType || "point",
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
				id: spatialDataId,
				name: body.name,
				description: body.description,
				latitude: body.latitude,
				longitude: body.longitude,
				dataType: body.dataType || "point",
			}

			return handleResponse({
				message: "Spatial data created successfully",
				callback: () => {
					set.status = ResponseSuccessStatus.CREATED
				},
				data: response,
				path,
			})
		},
		{
			body: "createSpatialDataModel",
		},
	)
