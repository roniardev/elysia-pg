import { Elysia } from "elysia";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";

import { verifyEmailModel } from "../data/auth.model";
import { jwtEmailSetup } from "../setup/auth";
import { getUser } from "@/src/general/usecase/get-user";

export const verifyEmail = new Elysia()
	.use(verifyEmailModel)
	.use(jwtEmailSetup)
	.post(
		"/verify-email",
		async ({ body, set, jwtEmail }) => {
			// CHECK VALID TOKEN
			const emailToken = await jwtEmail.verify(body.token);

			if (!emailToken) {
				set.status = 403;
				return {
					status: false,
					message: "Invalid token",
				};
			}

			// CHECK EXISTING USER
			const existingUser = await getUser({
				identifier: emailToken.id,
				type: "id",
				condition: {
					deleted: false,
				},
			});

			if (existingUser?.user?.emailVerified) {
				set.status = 403;
				return {
					status: false,
					message: "Email already verified",
				};
			}

			// CHECK EXISTING EMAIL VERIFICATION TOKEN
			const userToken = await db.query.emailVerificationTokens.findFirst({
				where: (table) => {
					return and(eq(table.userId, emailToken.id), eq(table.revoked, false));
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
