import bearer from "@elysiajs/bearer"
import { Elysia, t } from "elysia"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { getUser } from "@/src/general/usecase/get-user"
import { handleResponse } from "@/utils/handle-response"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { submitForCheck } from "@/utils/cms/workflow"

export const submitSpatialDataForCheck = new Elysia()
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/spatial-data/:id/submit-for-check",
		async ({ params, bearer, set, jwtAccess }) => {
			const path = "spatial-data.submit-for-check.usecase"
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

			const result = await submitForCheck(params.id, existingUser.user.id)

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
		},
	)
