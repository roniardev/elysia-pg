import { Elysia } from "elysia";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

import { resetPasswordModel } from "../data/auth.model";
import { jwtAccessSetup } from "../setup/auth";
import { getUser } from "@/src/general/usecase/get-user";
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { handleResponse } from "@/utils/handle-response";

export const resetPassword = new Elysia()
	.use(jwtAccessSetup)
	.use(resetPasswordModel)
	.post(
		"/reset-password",
		async ({ body, set, jwtAccess }) => {
			// CHECK VALID TOKEN
			const { password, confirmPassword } = body;
			const emailToken = await jwtAccess.verify(body.token);

			if (!emailToken) {
				return handleResponse(ErrorMessage.INVALID_EMAIL_TOKEN, () => {
					set.status = ResponseErrorStatus.BAD_REQUEST;
				});
			}

			// CHECK EXISTING USER
			const existingUser = await getUser({
				identifier: emailToken.id,
				type: "id",
				condition: {
					deleted: false,
				},
			});

			if (!existingUser?.user) {
				return handleResponse(ErrorMessage.USER_NOT_FOUND, () => {
					set.status = ResponseErrorStatus.NOT_FOUND;
				});
			}

			// CHECK EXISTING PASSWORD RESET TOKEN
			const existingToken = await db.query.passwordResetTokens.findFirst({
				where: (table) => {
					return and(eq(table.userId, emailToken.id), eq(table.revoked, false));
				},
			});

			if (!existingToken) {
				return handleResponse(ErrorMessage.INVALID_EMAIL_TOKEN, () => {
					set.status = ResponseErrorStatus.NOT_FOUND;
				});
			}

			// CHECK PASSWORD RESET TOKEN
			const validToken = await Bun.password.verify(
				body.token,
				existingToken?.hashedToken || "",
			);

			if (!existingToken || !validToken) {
				return handleResponse(ErrorMessage.INVALID_EMAIL_TOKEN, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}
			const isExpired = existingToken.expiresAt < new Date();

			if (isExpired) {
				return handleResponse(ErrorMessage.EMAIL_TOKEN_EXPIRED, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			const isRevoked = existingToken.revoked;

			if (isRevoked) {
				return handleResponse(ErrorMessage.INVALID_EMAIL_TOKEN, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			if (password !== confirmPassword) {
				return handleResponse(ErrorMessage.PASSWORD_DO_NOT_MATCH, () => {
					set.status = ResponseErrorStatus.BAD_REQUEST;
				});
			}

			const hashedPassword = await Bun.password.hash(body.password);

			// UPDATE USER PASSWORD
			try {
				await db
					.update(users)
					.set({
						hashedPassword,
					})
					.where(eq(users.id, existingUser.user?.id));
			} catch (error) {
				console.error(error);
				return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
					set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
				});
			}

			return handleResponse(SuccessMessage.PASSWORD_RESET_SUCCESS, () => {
				set.status = ResponseSuccessStatus.OK;
			});
		},
		{
			body: "resetPasswordModel",
		},
	);
