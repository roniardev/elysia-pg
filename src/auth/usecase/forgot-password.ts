import { and, eq, isNull } from "drizzle-orm"
import { Elysia } from "elysia"
import { ulid } from "ulid"

import { db } from "@/db"
import { passwordResetTokens } from "@/db/schema"
import { getUser } from "@/src/general/usecase/get-user"
import { sendEmail } from "@/utils/send-email"

import { resetPasswordTemplate } from "@/common/email-templates/reset-password"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { handleResponse } from "@/utils/handle-response"
import { forgotPasswordModel } from "../data/auth.model"
import { jwtEmailSetup } from "../setup/auth"
import RegexPattern from "@/common/regex-pattern"
import { verrou } from "@/utils/services/locks"

export const forgotPassword = new Elysia()
    .use(jwtEmailSetup)
    .use(forgotPasswordModel)
    .post(
        "/forgot-password",
        async ({ body, set, jwtEmail }) => {
            const path = "auth.forgot-password.usecase"
            const { email } = body

            const isValidEmail = email.match(RegexPattern.EMAIL)

            if (!isValidEmail) {
                return handleResponse({
                    message: ErrorMessage.INVALID_CREDENTIALS,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
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
                return handleResponse({
                    message: ErrorMessage.USER_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            const emailToken = await jwtEmail.sign({
                id: String(existingUser.user?.id),
            })

            const hashedToken = await Bun.password.hash(emailToken)

            await verrou
                .createLock(
                    `${email}:forgot-password:${existingUser.user?.id}:generateToken`,
                )
                .run(async () => {
                    try {
                        await db.insert(passwordResetTokens).values({
                            id: ulid(),
                            userId: String(existingUser.user?.id),
                            hashedToken,
                            expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
                        })
                    } catch (error) {
                        console.error(error)
                        return handleResponse({
                            message: ErrorMessage.INTERNAL_SERVER_ERROR,
                            callback: () => {
                                set.status =
                                    ResponseErrorStatus.INTERNAL_SERVER_ERROR
                            },
                            path,
                        })
                    }
                })

            await verrou
                .createLock(
                    `${email}:forgot-password:${existingUser.user?.id}:sendEmail`,
                )
                .run(async () => {
                    // SEND EMAIL
                    try {
                        await sendEmail(
                            email,
                            "Reset your password",
                            resetPasswordTemplate(emailToken),
                        )
                    } catch (error) {
                        console.error(error)
                        return handleResponse({
                            message: ErrorMessage.INTERNAL_SERVER_ERROR,
                            callback: () => {
                                set.status =
                                    ResponseErrorStatus.INTERNAL_SERVER_ERROR
                            },
                            path,
                        })
                    }
                })

            return handleResponse({
                message: SuccessMessage.EMAIL_SENT,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            body: "forgotPasswordModel",
        },
    )
