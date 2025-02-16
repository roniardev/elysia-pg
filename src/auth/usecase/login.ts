import { Elysia } from "elysia";
import dayjs from "dayjs";

import { db } from "@/db";
import { RedisClientConfig } from "@/utils/redis-client";
import { config } from "@/app/config";
import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth.setup";

export const login = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.post(
		"/login",
		async function handler({
			body,
			set,
			jwtAccess,
			jwtRefresh,
			server,
			request,
		}) {
			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.email, body.email);
				},
			});

			if (!existingUser) {
				set.status = 403;
				return {
					message: "Invalid credentials.",
				};
			}

			if (!existingUser.emailVerified) {
				set.status = 403;
				return {
					message: "Email not verified.",
				};
			}
			// CHECK VALID PASSWORD
			const validPassword = await Bun.password.verify(
				body.password,
				existingUser.hashedPassword || "",
			);

			if (!validPassword) {
				set.status = 403;
				return {
					message: "Invalid credentials.",
				};
			}

			const existingRefreshToken = await RedisClientConfig.get(
				`${existingUser.id}:refreshToken`,
			);

			const existingAccessToken = await RedisClientConfig.get(
				`${existingUser.id}:accessToken`,
			);

			if (existingRefreshToken || existingAccessToken) {
				set.status = 403;
				return {
					message: "Session already exists.",
				};
			}

			// GENERATE REFRESH TOKEN & ACCESS TOKEN
			const refreshToken = await jwtRefresh.sign({
				id: existingUser.id,
				exp: dayjs().unix() + config.REFRESH_TOKEN_EXPIRE_TIME,
			});

			const accessToken = await jwtAccess.sign({
				id: String(existingUser.id),
				exp: dayjs().unix() + config.ACCESS_TOKEN_EXPIRE_TIME,
			});

			await RedisClientConfig.set(
				`${existingUser.id}:refreshToken`,
				refreshToken,
			);

			await RedisClientConfig.expire(
				`${existingUser.id}:refreshToken`,
				config.REFRESH_TOKEN_EXPIRE_TIME,
			);

			await RedisClientConfig.set(
				`${existingUser.id}:accessToken`,
				accessToken,
			);

			await RedisClientConfig.expire(
				`${existingUser.id}:accessToken`,
				config.ACCESS_TOKEN_EXPIRE_TIME,
			);

			return {
				accessToken,
				refreshToken,
			};
		},
		{
			body: "basicAuthModel",
		},
	);
