import { Elysia } from "elysia";
import dayjs from "dayjs";
import bearer from "@elysiajs/bearer";

import { redis } from "@/utils/services/redis";

import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { handleResponse } from "@/utils/handle-response";

export const logout = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.use(bearer())
	.post(
		"/logout",
		async function handler({ bearer, set, jwtAccess, jwtRefresh }) {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
					set.status = ResponseErrorStatus.UNAUTHORIZED;
				});
			}

			// CHECK EXISTING SESSION
			const existingRefreshToken = await redis.get(
				`${validToken.id}:refreshToken`,
			);

			const existingAccessToken = await redis.get(
				`${validToken.id}:accessToken`,
			);

			if (validToken?.exp && validToken.exp < dayjs().unix()) {
				return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
					set.status = ResponseErrorStatus.UNAUTHORIZED;
				});
			}

			if (bearer !== existingAccessToken) {
				return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
					set.status = ResponseErrorStatus.UNAUTHORIZED;
				});
			}

			if (!existingRefreshToken || !existingAccessToken) {
				return handleResponse(ErrorMessage.FORBIDDEN, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			// DELETE REFRESH & ACCESS TOKEN FROM REDIS
			try {
				await redis.del(`${validToken.id}:refreshToken`);
				await redis.del(`${validToken.id}:accessToken`);
			} catch (error) {
				console.error(error);

				return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
					set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
				});
			}

			return handleResponse(SuccessMessage.LOGOUT_SUCCESS, () => {
				set.status = ResponseSuccessStatus.ACCEPTED;
			});
		},
	);
