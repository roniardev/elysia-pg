import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";
import { ulid } from "ulid";

import { db } from "@/db";
import { emailVerificationTokens, userPermissions, users } from "@/db/schema";
import { UserPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";

import { createUserModel } from "../data/users.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { verifyEmailTemplate } from "@/common/email-templates/verify-email";
import { sendEmail } from "@/utils/send-email";

export const createUser = new Elysia()
	.use(createUserModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/user",
		async ({ body, bearer, set, jwtAccess }) => {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			const { valid } = await verifyPermission(
				UserPermission.CREATE_USER,
				validToken.id,
			);

			if (!valid) {
				set.status = 403;
				return {
					status: false,
					message: "Invalid Permission",
				};
			}

			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.email, body.email);
				},
			});

			if (existingUser) {
				set.status = 400;
				return {
					status: false,
					message: "User already exists",
				};
			}

			// CREATE USER
			const userId = ulid();
			const { email, emailVerified, password, permissions } = body;

			const newUser = await db.insert(users).values({
				id: userId,
				email,
				emailVerified,
				hashedPassword: await Bun.password.hash(password),
			});

			if (!newUser) {
				set.status = 500;
				return {
					status: false,
					message: "Failed to create user",
				};
			}

			const emailToken = await jwtAccess.sign({
				id: userId,
			});

			const hashedToken = await Bun.password.hash(emailToken);

			if (!emailVerified) {
				// CREATE EMAIL VERIFICATION TOKEN
				try {
					await db.insert(emailVerificationTokens).values({
						id: ulid(),
						email,
						userId: userId,
						hashedToken,
						expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
					});
				} catch (error) {
					console.error(error);
					set.status = 500;

					return {
						status: false,
						message: "Failed to create email verification token",
					};
				}

				const emailResponse = await sendEmail(
					email,
					"Verify your email",
					verifyEmailTemplate(emailToken),
				);

				if (!emailResponse) {
					set.status = 500;
					return {
						status: false,
						message: "Failed to send email",
					};
				}
			}

			// CREATE USER PERMISSIONS
			if (permissions) {
				for (const permission of permissions) {
					await db.insert(userPermissions).values({
						id: ulid(),
						userId: userId,
						permissionId: permission,
					});
				}
			}

			set.status = 201;

			return {
				status: true,
				message: "User created successfully.",
			};
		},
		{
			body: "createUserModel",
		},
	);
