import { Elysia, t } from "elysia";
import { registerModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth.setup";
import { db } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";
import { generateId } from "lucia";
import { verifyEmailTemplate } from "@/common/email-templates/verify-email";
import { sendEmail } from "@/utils/send-email";

export const register = new Elysia()
	.use(registerModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.post(
		"/register",
		async function handler({ body, set, jwtRefresh }) {
			const { email, password, confirmPassword } = body;

			if (password !== confirmPassword) {
				set.status = 400;
				return {
					message: "Password and confirm password do not match",
				};
			}

			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.email, email);
				},
			});

			if (existingUser) {
				set.status = 400;
				return {
					message: "User already exists",
				};
			}

			const hashedPassword = await Bun.password.hash(password);
			const userId = generateId(21);
			const user = await db.insert(users).values({
				id: userId,
				email,
				emailVerified: false,
				hashedPassword,
			});

			if (!user) {
				set.status = 500;
				return {
					message: "Failed to register user",
				};
			}

			const emailToken = await jwtRefresh.sign({
				id: userId,
			});

			const hashedToken = await Bun.password.hash(emailToken);

			await db.insert(emailVerificationTokens).values({
				id: generateId(21),
				email,
				userId: userId,
				hashedToken,
				expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
			});

			const emailResponse = await sendEmail(
				email,
				"Verify your email",
				verifyEmailTemplate(emailToken),
			);

			if (!emailResponse) {
				set.status = 500;
				return {
					message: "Failed to send email",
				};
			}

			set.status = 201;
			return {
				message: "User registered successfully, please verify your email",
			};
		},
		{
			body: "registerModel",
		},
	);
