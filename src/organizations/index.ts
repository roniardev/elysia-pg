import { Elysia } from "elysia"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import bearer from "@elysiajs/bearer"

import { ErrorMessage } from "@/common/enum/response-message"
import { verifyAuth } from "../general/usecase/verify-auth"
import { createOrganization } from "./usecase/create"
import { deleteOrganization } from "./usecase/delete"
import { readOrganization } from "./usecase/read"
import { readAllOrganization } from "./usecase/read-all"
import { updateOrganization } from "./usecase/update"
import { switchOrganization } from "./usecase/switch"

export const organizations = new Elysia()
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
				.use(createOrganization)
				.use(readAllOrganization)
				.use(readOrganization)
				.use(updateOrganization)
				.use(deleteOrganization)
				.use(switchOrganization),
	)
