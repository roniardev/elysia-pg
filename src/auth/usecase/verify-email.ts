import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { db } from "@/db"
import { emailVerificationTokens, users } from "@/db/schema"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { getUser } from "@/src/general/usecase/get-user"
import { handleResponse } from "@/utils/handle-response"
import { verifyEmailModel } from "../data/auth.model"
import { jwtEmailSetup } from "../setup/auth"

export const verifyEmail = new Elysia()
    .use(verifyEmailModel)
    .use(jwtEmailSetup)
    .post(
        "/verify-email",
        async ({ body, set, jwtEmail }) => {
            const path = "auth.verify-email.usecase"
            // CHECK VALID TOKEN
            const emailToken = await jwtEmail.verify(body.token)

            if (!emailToken) {
                return handleResponse({
                    message: ErrorMessage.INVALID_EMAIL_TOKEN,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: emailToken.id,
                type: "id",
                condition: {
                    deleted: false,
                },
            })

            if (existingUser?.user?.emailVerified) {
                return handleResponse({
                    message: ErrorMessage.EMAIL_ALREADY_VERIFIED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // CHECK EXISTING EMAIL VERIFICATION TOKEN
            const userToken = await db.query.emailVerificationTokens.findFirst({
                where: (table, { eq, and }) => {
                    return and(
                        eq(table.userId, emailToken.id),
                        eq(table.revoked, false),
                    )
                },
            })

            const validToken = await Bun.password.verify(
                body.token,
                userToken?.hashedToken || "",
            )

            if (!userToken || !validToken) {
                return handleResponse({
                    message: ErrorMessage.INVALID_EMAIL_TOKEN,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            const isExpired = userToken.expiresAt < new Date()

            if (isExpired) {
                return handleResponse({
                    message: ErrorMessage.EMAIL_TOKEN_EXPIRED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.INVALID_EMAIL_TOKEN,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // UPDATE EMAIL VERIFICATION TOKEN
            const emailVerificationTokenUpdate = await db
                .update(emailVerificationTokens)
                .set({
                    revoked: true,
                })
                .where(eq(emailVerificationTokens.id, userToken.id))

            if (!emailVerificationTokenUpdate) {
                return handleResponse({
                    message: ErrorMessage.INTERNAL_SERVER_ERROR,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }

            // UPDATE USER EMAIL VERIFICATION
            try {
                await db
                    .update(users)
                    .set({
                        emailVerified: true,
                    })
                    .where(eq(users.id, userToken.userId))
            } catch (error) {
                console.error(error)
                return handleResponse({
                    message: ErrorMessage.INTERNAL_SERVER_ERROR,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.EMAIL_VERIFIED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            body: "verifyEmailModel",
        },
    )
