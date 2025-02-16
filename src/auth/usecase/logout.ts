import { Elysia } from "elysia";
import dayjs from "dayjs";
import bearer from "@elysiajs/bearer";
import { RedisClientConfig } from "@/utils/redis-client";

import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth.setup";

export const logout = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.use(bearer())
	.post("/logout", async function handler({ bearer, set, jwtAccess }) {
		const validToken = await jwtAccess.verify(bearer);

		if (!validToken) {
			set.status = 401;
			return {
				message: "Unauthorized",
			};
		}

		// CHECK EXISTING SESSION
		const existingRefreshToken = await RedisClientConfig.get(
			`${validToken.id}:refreshToken`,
		);

		const existingAccessToken = await RedisClientConfig.get(
			`${validToken.id}:accessToken`,
		);

		if (validToken?.exp && validToken.exp < dayjs().unix()) {
			set.status = 401;
			return {
				message: "Unauthorized",
			};
		}

		if (bearer !== existingAccessToken) {
			set.status = 401;
			return {
				message: "Unauthorized",
			};
		}

		if (!existingRefreshToken || !existingAccessToken) {
			set.status = 403;
			return {
				message: "Forbidden",
			};
		}

		await RedisClientConfig.del(`${validToken.id}:refreshToken`);
		await RedisClientConfig.del(`${validToken.id}:accessToken`);

		set.status = 202;

		return {
			message: "Logged out successfully.",
		};
	});
