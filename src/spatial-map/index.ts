import { Elysia } from "elysia"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import bearer from "@elysiajs/bearer"

import { ErrorMessage } from "@/common/enum/response-message"
import { verifyAuth } from "../general/usecase/verify-auth"
import { createSpatialMap } from "./usecase/create"
import { deleteSpatialMap } from "./usecase/delete"
import { readSpatialMap } from "./usecase/read"
import { readAllSpatialMap } from "./usecase/read-all"
import { updateSpatialMap } from "./usecase/update"

export const spatialMapRoutes = new Elysia()
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
				.use(createSpatialMap)
				.use(readAllSpatialMap)
				.use(deleteSpatialMap)
				.use(readSpatialMap)
				.use(updateSpatialMap),
	)
