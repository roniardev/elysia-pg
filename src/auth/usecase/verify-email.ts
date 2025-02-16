import { Elysia } from "elysia";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";

import { verifyEmailModel } from "../data/auth.model";
import { jwtAccessSetup } from "../setup/auth";

export const verifyEmail = new Elysia()
	.use(verifyEmailModel)
	.use(jwtAccessSetup)
	.post(
		"/verify-email",
		async ({ body, set, jwtAccess }) => {
			// CHECK VALID TOKEN
			const emailToken = await jwtAccess.verify(body.token);

			if (!emailToken) {
				set.status = 403;
				return {
					status: false,
					message: "Invalid token",
				};
			}

			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, emailToken.id);
				},
			});

			if (existingUser?.emailVerified) {
				set.status = 403;
				return {
					status: false,
					message: "Email already verified",
				};
			}

			// CHECK EXISTING EMAIL VERIFICATION TOKEN
			const userToken = await db.query.emailVerificationTokens.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.userId, emailToken.id);
				},
			});

			const validToken = await Bun.password.verify(
				body.token,
				userToken?.hashedToken || "",
			);

			if (!userToken || !validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Invalid token",
				};
			}

			const isExpired = userToken.expiresAt < new Date();

			if (isExpired) {
				set.status = 403;
				return {
					status: false,
					message: "Token expired",
				};
			}

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Invalid token",
				};
			}

			// UPDATE EMAIL VERIFICATION TOKEN
			const emailVerificationTokenUpdate = await db
				.update(emailVerificationTokens)
				.set({
					revoked: true,
				})
				.where(eq(emailVerificationTokens.id, userToken.id));

			if (!emailVerificationTokenUpdate) {
				set.status = 500;
				return {
					status: false,
					message: "Failed to verify email",
				};
			}

			// UPDATE USER EMAIL VERIFICATION
			try {
				await db
					.update(users)
					.set({
						emailVerified: true,
					})
					.where(eq(users.id, userToken.userId));
			} catch (error) {
				console.error(error);
				set.status = 500;

				return {
					status: false,
					message: "Failed to verify email",
				};
			}

			set.status = 200;
			return {
				status: true,
				message: "Email verified",
			};
		},
		{
			body: "verifyEmailModel",
		},
	);
