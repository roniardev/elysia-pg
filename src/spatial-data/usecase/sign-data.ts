import bearer from "@elysiajs/bearer"
import { Elysia, t } from "elysia"

import { ErrorMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { getUser } from "@/src/general/usecase/get-user"
import { handleResponse } from "@/utils/handle-response"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { signData } from "@/utils/cms/workflow"

export const signSpatialData = new Elysia()
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/spatial-data/:id/sign",
		async ({ params, body, bearer, set, jwtAccess }) => {
			const path = "spatial-data.sign.usecase"
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

			const result = await signData(
				params.id,
				existingUser.user.id,
				body.approved,
				body.comments,
			)

			if (!result.success) {
				return handleResponse({
					message: result.message,
					callback: () => {
						set.status = ResponseErrorStatus.BAD_REQUEST
					},
					path,
				})
			}

			return handleResponse({
				message: result.message,
				callback: () => {
					set.status = ResponseSuccessStatus.OK
				},
				path,
			})
		},
		{
			params: t.Object({
				id: t.String(),
			}),
			body: t.Object({
				approved: t.Boolean(),
				comments: t.Optional(t.String()),
			}),
		},
	)
