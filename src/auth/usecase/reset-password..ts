import { Elysia } from "elysia";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

import { resetPasswordModel } from "../data/auth.model";
import { jwtAccessSetup } from "../setup/auth";

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
				set.status = 403;
				return {
					status: false,
					message: "Token invalid",
				};
			}

			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, emailToken.id);
				},
			});

			if (!existingUser) {
				set.status = 404;
				return {
					status: false,
					message: "User not found",
				};
			}

			// CHECK EXISTING PASSWORD RESET TOKEN
			const existingToken = await db.query.passwordResetTokens.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.userId, emailToken.id);
				},
			});

			if (!existingToken) {
				set.status = 404;
				return {
					status: false,
					message: "Token invalid",
				};
			}

			// CHECK PASSWORD RESET TOKEN
			const validToken = await Bun.password.verify(
				body.token,
				existingToken?.hashedToken || "",
			);

			if (!existingToken || !validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Token invalid",
				};
			}
			const isExpired = existingToken.expiresAt < new Date();

			if (isExpired) {
				set.status = 403;
				return {
					status: false,
					message: "Token expired",
				};
			}

			const isRevoked = existingToken.revoked;

			if (isRevoked) {
				set.status = 403;
				return {
					status: false,
					message: "Token revoked",
				};
			}

			if (password !== confirmPassword) {
				set.status = 400;
				return {
					status: false,
					message: "Password and confirm password do not match",
				};
			}

			const hashedPassword = await Bun.password.hash(body.password);

			// UPDATE USER PASSWORD
			try {
				await db
					.update(users)
					.set({
						hashedPassword,
					})
					.where(eq(users.id, existingUser.id));
			} catch (error) {
				console.error(error);
				set.status = 500;

				return {
					status: false,
					message: "Failed to reset password",
				};
			}

			set.status = 200;

			return {
				status: true,
				message: "Password reset successfully",
			};
		},
		{
			body: "resetPasswordModel",
		},
	);
