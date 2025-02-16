import { Elysia } from "elysia";
import dayjs from "dayjs";
import bearer from "@elysiajs/bearer";

import { config } from "@/app/config";
import { redis } from "@/utils/services/redis";

import { jwtRefreshSetup, jwtAccessSetup } from "../setup/auth";
import { regenerateAccessTokenModel } from "../data/auth.model";

export const regenerateAccessToken = new Elysia()
	.use(jwtRefreshSetup)
	.use(jwtAccessSetup)
	.use(regenerateAccessTokenModel)
	.use(bearer())
	.get(
		"/regenerate-access-token",
		async ({ set, jwtRefresh, bearer, jwtAccess }) => {
			// CHECK VALID TOKEN
			const validToken = await jwtRefresh.verify(bearer);

			if (!validToken) {
				set.status = 401;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			const refreshToken = await jwtRefresh.sign({
				id: validToken.id,
				exp: dayjs().unix() + config.REFRESH_TOKEN_EXPIRE_TIME,
			});

			const accessToken = await jwtAccess.sign({
				id: String(validToken.id),
				exp: dayjs().unix() + config.ACCESS_TOKEN_EXPIRE_TIME,
			});

			// SET REFRESH & ACCESS TOKEN TO REDIS
			try {
				await redis.set(`${validToken.id}:refreshToken`, refreshToken);

				await redis.expire(
					`${validToken.id}:refreshToken`,
					config.REFRESH_TOKEN_EXPIRE_TIME,
				);

				await redis.set(`${validToken.id}:accessToken`, accessToken);

				await redis.expire(
					`${validToken.id}:accessToken`,
					config.ACCESS_TOKEN_EXPIRE_TIME,
				);
			} catch (error) {
				console.error(error);
				set.status = 500;

				return {
					status: false,
					message: "Internal server error.",
				};
			}

			return {
				status: true,
				message: "Access token regenerated successfully.",
				accessToken,
				refreshToken,
			};
		},
	);
