import { Elysia } from "elysia";
import dayjs from "dayjs";

import { db } from "@/db";
import { redis } from "@/utils/services/redis";
import { config } from "@/app/config";
import { verrou } from "@/utils/services/locks";

import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth";

export const login = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.post(
		"/login",
		async function handler({ body, set, jwtAccess, jwtRefresh }) {
			await verrou.createLock("login").run(async () => {
				// CHECK EXISTING USER
				const existingUser = await db.query.users.findFirst({
					where: (table, { eq: eqFn }) => {
						return eqFn(table.email, body.email);
					},
				});

				if (!existingUser) {
					set.status = 403;
					return {
						status: false,
						message: "Invalid credentials.",
					};
				}

				if (!existingUser.emailVerified) {
					set.status = 403;
					return {
						status: false,
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
						status: false,
						message: "Invalid credentials.",
					};
				}

				// CHECK EXISTING REFRESH TOKEN
				const existingRefreshToken = await redis.get(
					`${existingUser.id}:refreshToken`,
				);

				const existingAccessToken = await redis.get(
					`${existingUser.id}:accessToken`,
				);

				if (existingRefreshToken || existingAccessToken) {
					set.status = 403;
					return {
						status: false,
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

				// SET REFRESH TOKEN & ACCESS TOKEN TO REDIS
				try {
					await redis.set(`${existingUser.id}:refreshToken`, refreshToken);

					await redis.expire(
						`${existingUser.id}:refreshToken`,
						config.REFRESH_TOKEN_EXPIRE_TIME,
					);

					await redis.set(`${existingUser.id}:accessToken`, accessToken);

					await redis.expire(
						`${existingUser.id}:accessToken`,
						config.ACCESS_TOKEN_EXPIRE_TIME,
					);
				} catch (error) {
					console.error(error);
					set.status = 500;

					return {
						status: false,
						message: "Internal server error.",
						data: error,
					};
				}

				return {
					status: true,
					message: "Login successful.",
					accessToken,
					refreshToken,
				};
			});
		},
		{
			body: "basicAuthModel",
		},
	);
