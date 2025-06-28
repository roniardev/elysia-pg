import { Elysia } from "elysia"
import { ulid } from "ulid"
import { and, eq, isNull } from "drizzle-orm"

import { db } from "@/db"
import { passwordResetTokens } from "@/db/schema"
import { sendEmail } from "@/utils/send-email"
import { getUser } from "@/src/general/usecase/get-user"

import { forgotPasswordModel } from "../data/auth.model"
import { jwtEmailSetup } from "../setup/auth"
import { resetPasswordTemplate } from "@/common/email-templates/reset-password"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import { handleResponse } from "@/utils/handle-response"
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status"

export const forgotPassword = new Elysia()
	.use(jwtEmailSetup)
	.use(forgotPasswordModel)
	.post(
		"/forgot-password",
		async ({ body, set, jwtEmail }) => {
			const { email } = body

			const isValidEmail = email.match(
				/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
			)

			if (!isValidEmail) {
				return handleResponse(ErrorMessage.INVALID_EMAIL, () => {
					set.status = ResponseErrorStatus.BAD_REQUEST
				})
			}

			// CHECK EXISTING USER
			const existingUser = await getUser({
				identifier: email,
				type: "email",
				condition: {
					deleted: false,
					verified: true,
				},
			})

			if (!existingUser.valid) {
				return handleResponse(ErrorMessage.USER_NOT_FOUND, () => {
					set.status = ResponseErrorStatus.NOT_FOUND
				})
			}

			const emailToken = await jwtEmail.sign({
				id: String(existingUser.user?.id),
			})

			const hashedToken = await Bun.password.hash(emailToken)

			try {
				await db.insert(passwordResetTokens).values({
					id: ulid(),
					userId: String(existingUser.user?.id),
					hashedToken,
					expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
				})
			} catch (error) {
				console.error(error)
				return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
					set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
				})
			}

			// SEND EMAIL
			const emailResponse = await sendEmail(
				email,
				"Reset your password",
				resetPasswordTemplate(emailToken),
			)

			if (!emailResponse) {
				return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
					set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
				})
			}

			return handleResponse(SuccessMessage.EMAIL_SENT, () => {
				set.status = ResponseSuccessStatus.OK
			})
		},
		{
			body: "forgotPasswordModel",
		},
	)