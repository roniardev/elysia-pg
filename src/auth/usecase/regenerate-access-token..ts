import { Elysia } from "elysia";
import { jwtRefreshSetup, jwtAccessSetup } from "../setup/auth.setup";
import { regenerateAccessTokenModel } from "../data/auth.model";
import { RedisClientConfig } from "@/utils/redis-client";
import { config } from "@/app/config";
import dayjs from "dayjs";
import bearer from "@elysiajs/bearer";

export const regenerateAccessToken = new Elysia()
	.use(jwtRefreshSetup)
	.use(jwtAccessSetup)
	.use(regenerateAccessTokenModel)
	.use(bearer())
	.get(
		"/regenerate-access-token",
		async ({ set, jwtRefresh, bearer, jwtAccess }) => {
			const validToken = await jwtRefresh.verify(bearer);

			if (!validToken) {
				set.status = 401;
				return {
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

			await RedisClientConfig.set(
				`${validToken.id}:refreshToken`,
				refreshToken,
			);

			await RedisClientConfig.expire(
				`${validToken.id}:refreshToken`,
				config.REFRESH_TOKEN_EXPIRE_TIME,
			);

			await RedisClientConfig.set(`${validToken.id}:accessToken`, accessToken);

			await RedisClientConfig.expire(
				`${validToken.id}:accessToken`,
				config.ACCESS_TOKEN_EXPIRE_TIME,
			);

			return {
				accessToken,
				refreshToken,
			};
		},
	);
