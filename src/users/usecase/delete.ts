import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verrou } from "@/utils/services/locks";
import { UserPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";

import { deleteUserModel } from "../data/users.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { handleResponse } from "@/utils/handle-response";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { getUser } from "@/src/general/usecase/get-user";
export const deleteUser = new Elysia()
	.use(deleteUserModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.delete(
		"/user/:id",
		async ({ bearer, set, jwtAccess, params }) => {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			const { valid } = await verifyPermission(
				UserPermission.DELETE_USER,
				validToken.id,
			);

			if (!valid) {
				return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			const existingUser = await getUser({
				identifier: params.id,
				type: "id",
			});

			if (!existingUser.user) {
				return handleResponse(ErrorMessage.USER_NOT_FOUND, () => {
					set.status = ResponseErrorStatus.NOT_FOUND;
				});
			}

			if (existingUser.user.deletedAt) {
				return handleResponse(ErrorMessage.USER_ALREADY_DELETED, () => {
					set.status = ResponseErrorStatus.BAD_REQUEST;
				});
			}

			const { user } = existingUser;

			await verrou.createLock(`user:${user.id}`).run(async () => {
				try {
					// await 15s
					await new Promise((resolve) => setTimeout(resolve, 15000));

					await db
						.update(users)
						.set({
							deletedAt: new Date(),
						})
						.where(eq(users.id, user.id));
				} catch (error) {
					console.error(error);
					return handleResponse(ErrorMessage.FAILED_TO_DELETE_USER, () => {
						set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
					});
				}
			});

			return handleResponse(SuccessMessage.USER_DELETED, () => {
				set.status = ResponseSuccessStatus.OK;
			});
		},
		{
			params: "deleteUserModel",
		},
	);
