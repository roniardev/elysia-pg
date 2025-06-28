import { Elysia } from "elysia"
import { ulid } from "ulid"

import { verifyEmailTemplate } from "@/common/email-templates/verify-email"
import { db } from "@/db"
import { emailVerificationTokens, users } from "@/db/schema"
import { getUser } from "@/src/general/usecase/get-user"
import { sendEmail } from "@/utils/send-email"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { handleResponse } from "@/utils/handle-response"
import { registerModel } from "../data/auth.model"
import { jwtAccessSetup } from "../setup/auth"

export const register = new Elysia()
    .use(registerModel)
    .use(jwtAccessSetup)
    .post(
        "/register",
        async function handler({ body, set, jwtAccess }) {
            const { email, password, confirmPassword } = body

            const isValidEmail = email.match(
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            )

            if (!isValidEmail) {
                return handleResponse(ErrorMessage.INVALID_EMAIL, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
                })
            }

            if (password !== confirmPassword) {
                return handleResponse(
                    ErrorMessage.PASSWORD_DO_NOT_MATCH,
                    () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                )
            }

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: email,
                type: "email",
            })

            if (existingUser.valid) {
                return handleResponse(ErrorMessage.USER_ALREADY_EXISTS, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
                })
            }

            // CREATE USER
            const hashedPassword = await Bun.password.hash(password)
            const userId = ulid()
            const user = await db.insert(users).values({
                id: userId,
                email,
                emailVerified: false,
                hashedPassword,
            })

            if (!user) {
                return handleResponse(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                )
            }

            const emailToken = await jwtAccess.sign({
                id: userId,
            })

            const hashedToken = await Bun.password.hash(emailToken)

            // CREATE EMAIL VERIFICATION TOKEN
            try {
                await db.insert(emailVerificationTokens).values({
                    id: ulid(),
                    email,
                    userId: userId,
                    hashedToken,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
                })
            } catch (error) {
                console.error(error)
                set.status = 500

                return {
                    status: false,
                    message: ErrorMessage.INTERNAL_SERVER_ERROR,
                }
            }

            const emailResponse = await sendEmail(
                email,
                "Verify your email",
                verifyEmailTemplate(emailToken),
            )

            if (!emailResponse) {
                return handleResponse(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                )
            }

            return handleResponse(SuccessMessage.USER_REGISTERED, () => {
                set.status = ResponseSuccessStatus.CREATED
            })
        },
        {
            body: "registerModel",
        },
    )
