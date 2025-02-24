import { Elysia } from "elysia";
import { and, eq, isNull } from "drizzle-orm";

import dayjs from "dayjs";

import { db } from "@/db";
import { redis } from "@/utils/services/redis";
import { config } from "@/app/config";
import { verrou } from "@/utils/services/locks";

import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth";
import { handleErrorResponse } from "@/utils/handle-error-response";
import { ResponseErrorStatus } from "@/common/enum/response-status";
import { ErrorMessage } from "@/common/enum/error-message";

export const login = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.post(
		"/login",
		async function handler({ body, set, jwtAccess, jwtRefresh }) {
			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table) => {
					return and(eq(table.email, body.email), isNull(table.deletedAt));
				},
			});

			if (!existingUser) {
				return handleErrorResponse(
					ResponseErrorStatus.FORBIDDEN,
					ErrorMessage.INVALID_CREDENTIALS,
					() => {
						set.status = 403;
					},
				);
			}

			if (!existingUser.emailVerified) {
				return handleErrorResponse(
					ResponseErrorStatus.FORBIDDEN,
					ErrorMessage.EMAIL_NOT_VERIFIED,
					() => {
						set.status = 403;
					},
				);
			}
			// CHECK VALID PASSWORD
			const validPassword = await Bun.password.verify(
				body.password,
				existingUser.hashedPassword || "",
			);

			if (!validPassword) {
				return handleErrorResponse(
					ResponseErrorStatus.FORBIDDEN,
					ErrorMessage.INVALID_CREDENTIALS,
					() => {
						set.status = 403;
					},
				);
			}

			// CHECK EXISTING REFRESH TOKEN
			const existingRefreshToken = await redis.get(
				`${existingUser.id}:refreshToken`,
			);

			const existingAccessToken = await redis.get(
				`${existingUser.id}:accessToken`,
			);

			if (existingRefreshToken) {
				return handleErrorResponse(
					ResponseErrorStatus.FORBIDDEN,
					ErrorMessage.SESSION_ALREADY_EXISTS,
					() => {
						set.status = 403;
					},
				);
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

			await verrou.createLock(`${existingUser.id}:login`).run(async () => {
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
					return handleErrorResponse(
						ResponseErrorStatus.INTERNAL_SERVER_ERROR,
						ErrorMessage.INTERNAL_SERVER_ERROR,
						() => {
							set.status = 500;
						},
					);
				}
			});

			return {
				status: true,
				message: "Login successful.",
				accessToken,
				refreshToken,
			};
		},
		{
			body: "basicAuthModel",
		},
	);
