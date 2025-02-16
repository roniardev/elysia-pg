import { Elysia } from "elysia";
import dayjs from "dayjs";
import bearer from "@elysiajs/bearer";

import { redis } from "@/utils/services/redis";

import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth";

export const logout = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.use(bearer())
	.post("/logout", async function handler({ bearer, set, jwtAccess }) {
		// CHECK VALID TOKEN
		const validToken = await jwtAccess.verify(bearer);

		if (!validToken) {
			set.status = 401;
			return {
				status: false,
				message: "Unauthorized",
			};
		}

		// CHECK EXISTING SESSION
		const existingRefreshToken = await redis.get(
			`${validToken.id}:refreshToken`,
		);

		const existingAccessToken = await redis.get(`${validToken.id}:accessToken`);

		if (validToken?.exp && validToken.exp < dayjs().unix()) {
			set.status = 401;
			return {
				status: false,
				message: "Unauthorized",
			};
		}

		if (bearer !== existingAccessToken) {
			set.status = 401;
			return {
				status: false,
				message: "Unauthorized",
			};
		}

		if (!existingRefreshToken || !existingAccessToken) {
			set.status = 403;
			return {
				status: false,
				message: "Forbidden",
			};
		}

		// DELETE REFRESH & ACCESS TOKEN FROM REDIS
		try {
			await redis.del(`${validToken.id}:refreshToken`);
			await redis.del(`${validToken.id}:accessToken`);
		} catch (error) {
			console.error(error);
			set.status = 500;

			return {
				status: false,
				message: "Internal server error.",
			};
		}

		set.status = 202;

		return {
			status: true,
			message: "Logged out successfully.",
		};
	});
