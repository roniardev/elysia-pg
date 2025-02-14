import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Elysia } from "elysia";
import { resetPasswordModel } from "../data/auth.model";
import { jwtAccessSetup } from "../setup/auth.setup";

export const resetPassword = new Elysia()
	.use(jwtAccessSetup)
	.use(resetPasswordModel)
	.post(
		"/reset-password",
		async ({ body, set, jwtAccess }) => {
			const { token, password, confirmPassword } = body;
			const emailToken = await jwtAccess.verify(body.token);

			if (!emailToken) {
				set.status = 403;
				return {
					message: "Token invalid",
				};
			}

			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, emailToken.id);
				},
			});

			if (!existingUser) {
				set.status = 404;
				return {
					message: "User not found",
				};
			}

			const existingToken = await db.query.passwordResetTokens.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.userId, emailToken.id);
				},
			});

			if (!existingToken) {
				set.status = 404;
				return {
					message: "Token invalid",
				};
			}

			const validToken = await Bun.password.verify(
				body.token,
				existingToken?.hashedToken || "",
			);

			if (!existingToken || !validToken) {
				set.status = 403;
				return {
					message: "Token invalid",
				};
			}
			const isExpired = existingToken.expiresAt < new Date();

			if (isExpired) {
				set.status = 403;
				return {
					message: "Token expired",
				};
			}

			const isRevoked = existingToken.revoked;

			if (isRevoked) {
				set.status = 403;
				return {
					message: "Token revoked",
				};
			}

			if (password !== confirmPassword) {
				set.status = 400;
				return {
					message: "Password and confirm password do not match",
				};
			}

			const hashedPassword = await Bun.password.hash(body.password);

			await db
				.update(users)
				.set({
					hashedPassword,
				})
				.where(eq(users.id, existingToken.userId));

			set.status = 200;

			return {
				message: "Password reset successfully",
			};
		},
		{
			body: "resetPasswordModel",
		},
	);
