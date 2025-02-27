import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { UserPermission } from "@/common/enum/permissions";
import { handleResponse } from "@/utils/handle-response";
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";

import { readUserModel } from "../data/users.model";

export const readUser = new Elysia()
	.use(readUserModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/user/:id",
		async ({ params, bearer, set, jwtAccess }) => {
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			const { valid } = await verifyPermission(
				UserPermission.READ_USER,
				validToken.id,
			);

			if (!valid) {
				return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			const user = await db.query.users.findFirst({
				where: (table, { eq }) => {
					return eq(table.id, params.id);
				},
				with: {
					permissions: true,
				},
			});

			if (!user) {
				return handleResponse(ErrorMessage.USER_NOT_FOUND, () => {
					set.status = ResponseErrorStatus.NOT_FOUND;
				});
			}

			const data = {
				id: user.id,
				email: user.email,
				emailVerified: user.emailVerified,
				permissions: user.permissions,
			};

			return handleResponse(
				SuccessMessage.USER_FOUND,
				() => {
					set.status = ResponseSuccessStatus.OK;
				},
				{
					data: data,
				},
			);
		},
		{
			params: "readUserModel",
		},
	);