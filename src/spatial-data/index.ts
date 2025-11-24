import { Elysia } from "elysia"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import bearer from "@elysiajs/bearer"

import { ErrorMessage } from "@/common/enum/response-message"
import { verifyAuth } from "../general/usecase/verify-auth"
import { createSpatialData } from "./usecase/create"
import { deleteSpatialData } from "./usecase/delete"
import { readSpatialData } from "./usecase/read"
import { readAllSpatialData } from "./usecase/read-all"
import { updateSpatialData } from "./usecase/update"
import { uploadShapefile } from "./usecase/upload-shapefile"

export const spatialDataRoutes = new Elysia()
	.use(jwtAccessSetup)
	.use(bearer())
	.guard(
		{
			beforeHandle: async ({ bearer, jwtAccess, set }) => {
				const token = await jwtAccess.verify(bearer)
				let valid = false
				let message = ""

				if (token && bearer) {
					const { valid: isAuthorized, message: authMessage } =
						await verifyAuth(bearer, token)
					valid = isAuthorized
					message = authMessage
				}

				if (!valid) {
					set.status = 401
					return {
						status: false,
						message: ErrorMessage.UNAUTHORIZED,
					}
				}
			},
		},
		(app) =>
			app
				.use(createSpatialData)
				.use(readAllSpatialData)
				.use(deleteSpatialData)
				.use(readSpatialData)
				.use(updateSpatialData)
				.use(uploadShapefile),
	)
