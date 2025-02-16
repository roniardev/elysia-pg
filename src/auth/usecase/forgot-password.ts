import { Elysia } from "elysia";
import { generateId } from "lucia";

import { db } from "@/db";
import { passwordResetTokens } from "@/db/schema";
import { sendEmail } from "@/utils/send-email";

import { forgotPasswordModel } from "../data/auth.model";
import { jwtRefreshSetup } from "../setup/auth";
import { resetPasswordTemplate } from "@/common/email-templates/reset-password";

export const forgotPassword = new Elysia()
	.use(jwtRefreshSetup)
	.use(forgotPasswordModel)
	.post(
		"/forgot-password",
		async ({ body, set, jwtRefresh }) => {
			const { email } = body;

			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.email, email);
				},
			});

			if (!existingUser) {
				set.status = 404;
				return {
					status: false,
					message: "User not found",
				};
			}

			const emailToken = await jwtRefresh.sign({
				id: existingUser.id,
			});
			const hashedToken = await Bun.password.hash(emailToken);

			try {
				await db.insert(passwordResetTokens).values({
					id: generateId(21),
					userId: existingUser.id,
					hashedToken,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
				});
			} catch (error) {
				console.error(error);
				set.status = 500;
				return {
					status: false,
					message: "Internal server error.",
				};
			}

			// SEND EMAIL
			const emailResponse = await sendEmail(
				email,
				"Reset your password",
				resetPasswordTemplate(emailToken),
			);

			if (!emailResponse) {
				set.status = 500;
				return {
					status: false,
					message: "Failed to send email",
				};
			}

			set.status = 200;

			return {
				status: true,
				message:
					"Email sent, please check your email for the reset password link",
			};
		},
		{
			body: "forgotPasswordModel",
		},
	);
