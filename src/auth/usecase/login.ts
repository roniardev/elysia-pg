import { Elysia } from "elysia"
import { and, eq, isNull } from "drizzle-orm"

import dayjs from "dayjs"

import { redis } from "@/utils/services/redis"
import { config } from "@/app/config"
import { verrou } from "@/utils/services/locks"
import ExpiredTime from "@/utils/expired-time"

import { basicAuthModel } from "../data/auth.model"
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth"
import { handleResponse } from "@/utils/handle-response"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import { getUser } from "@/src/general/usecase/get-user"

export const login = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.post(
		"/login",
		async function handler({ body, set, jwtAccess, jwtRefresh }) {

			const isValidEmail = body.email.match(
				/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
			)

			if (!isValidEmail) {
				return handleResponse(ErrorMessage.INVALID_EMAIL, () => {
					set.status = ResponseErrorStatus.BAD_REQUEST
				})
			}

			// CHECK EXISTING USER
			const existingUser = await getUser({
				identifier: body.email,
				type: "email",
				condition: {
					verified: false,
					deleted: false,
				},
			})

			if (!existingUser.valid) {
				return handleResponse(ErrorMessage.INVALID_CREDENTIALS, () => {
					set.status = ResponseErrorStatus.FORBIDDEN
				})
			}

			if (!existingUser.user?.emailVerified) {
				return handleResponse(ErrorMessage.EMAIL_NOT_VERIFIED, () => {
					set.status = ResponseErrorStatus.FORBIDDEN
				})
			}
			// CHECK VALID PASSWORD
			const validPassword = await Bun.password.verify(
				body.password,
				existingUser.user?.hashedPassword || "",
			)
  
			if (!validPassword) {
				return handleResponse(ErrorMessage.INVALID_CREDENTIALS, () => {
					set.status = ResponseErrorStatus.FORBIDDEN
				})
			}

			// CHECK EXISTING REFRESH TOKEN
			const existingRefreshToken = await redis.get(
				`${existingUser.user?.id}:refreshToken`,
			)

			const existingAccessToken = await redis.get(
				`${existingUser.user?.id}:accessToken`,
			)

			if (existingRefreshToken) {
				return handleResponse(ErrorMessage.SESSION_ALREADY_EXISTS, () => {
					set.status = ResponseErrorStatus.FORBIDDEN
				})
			}

			// GENERATE REFRESH TOKEN & ACCESS TOKEN
			const refreshToken = await jwtRefresh.sign({
				id: existingUser.user?.id,
				exp: ExpiredTime.getExpiredRefreshToken(),
			})

			const accessToken = await jwtAccess.sign({
				id: String(existingUser.user?.id),
				exp: dayjs().unix() + config.ACCESS_TOKEN_EXPIRE_TIME,
			})

			await verrou.createLock(`${existingUser.user?.id}:login`).run(async () => {
				// SET REFRESH TOKEN & ACCESS TOKEN TO REDIS
				try {
					await redis.set(
						`${existingUser.user?.id}:refreshToken`,
						refreshToken,
					)

					await redis.expire(
						`${existingUser.user?.id}:refreshToken`,
						config.REFRESH_TOKEN_EXPIRE_TIME,
					)

					await redis.set(`${existingUser.user?.id}:accessToken`, accessToken)

					await redis.expire(
						`${existingUser.user?.id}:accessToken`,
						config.ACCESS_TOKEN_EXPIRE_TIME,
					)
				} catch (error) {
					console.error(error)
					return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
						set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
					})
				}
			})

			return handleResponse(
				SuccessMessage.LOGIN_SUCCESS,
				() => {
					set.status = ResponseSuccessStatus.OK
				},
				{
					accessToken,
					refreshToken,
				},
			)
		},
		{
			body: "basicAuthModel",
		},
	)