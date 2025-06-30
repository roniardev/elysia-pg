import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { db } from "@/db"
import { users } from "@/db/schema"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { getUser } from "@/src/general/usecase/get-user"
import { handleResponse } from "@/utils/handle-response"
import { resetPasswordModel } from "../data/auth.model"
import { jwtAccessSetup } from "../setup/auth"
import { verrou } from "@/utils/services/locks"

export const resetPassword = new Elysia()
    .use(jwtAccessSetup)
    .use(resetPasswordModel)
    .post(
        "/reset-password",
        async ({ body, set, jwtAccess }) => {
            const path = "auth.reset-password.usecase"
            // CHECK VALID TOKEN
            const { password, confirmPassword } = body
            const emailToken = await jwtAccess.verify(body.token)

            if (!emailToken) {
                return handleResponse({
                    message: ErrorMessage.INVALID_EMAIL_TOKEN,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
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

            if (!existingUser?.user) {
                return handleResponse({
                    message: ErrorMessage.USER_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            // CHECK EXISTING PASSWORD RESET TOKEN
            const existingToken = await db.query.passwordResetTokens.findFirst({
                where: (table, { eq, and }) => {
                    return and(
                        eq(table.userId, emailToken.id),
                        eq(table.revoked, false),
                    )
                },
            })

            if (!existingToken) {
                return handleResponse({
                    message: ErrorMessage.INVALID_EMAIL_TOKEN,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            // CHECK PASSWORD RESET TOKEN
            const validToken = await Bun.password.verify(
                body.token,
                existingToken?.hashedToken || "",
            )

            if (!existingToken || !validToken) {
                return handleResponse({
                    message: ErrorMessage.INVALID_EMAIL_TOKEN,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                })
            }
            const isExpired = existingToken.expiresAt < new Date()

            if (isExpired) {
                return handleResponse({
                    message: ErrorMessage.EMAIL_TOKEN_EXPIRED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            const isRevoked = existingToken.revoked

            if (isRevoked) {
                return handleResponse({
                    message: ErrorMessage.INVALID_EMAIL_TOKEN,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                })
            }

            if (password !== confirmPassword) {
                return handleResponse({
                    message: ErrorMessage.PASSWORD_DO_NOT_MATCH,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            const hashedPassword = await Bun.password.hash(body.password)

            await verrou
                .createLock(`${existingUser.user?.id}:reset-password`)
                .run(async () => {
                    try {
                        await db
                            .update(users)
                            .set({
                                hashedPassword,
                            })
                            .where(eq(users.id, String(existingUser.user?.id)))
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
                message: SuccessMessage.PASSWORD_RESET_SUCCESS,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            body: "resetPasswordModel",
        },
    )
