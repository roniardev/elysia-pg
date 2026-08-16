import { Elysia } from "elysia"
import { ulid } from "ulid"

import { verifyEmailTemplate } from "@/common/email-templates/verify-email"
import { UserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { emailVerificationTokens, userPermissions, users } from "@/db/schema"
import { requirePermission } from "@/src/general/setup/require-permission"
import { getUser } from "@/src/general/usecase/get-user"
import { createUserModel } from "@/src/users/data/users.model"
import { handleResponse } from "@/utils/handle-response"
import { sendEmail } from "@/utils/send-email"

export const createUser = new Elysia()
    .use(createUserModel)
    .use(requirePermission(UserPermission.CREATE_USER))
    .post(
        "/user",
        async ({ body, set, jwtAccess }) => {
            const path = "users.create.usecase"

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: body.email,
                type: "email",
            })

            if (existingUser.user) {
                return handleResponse({
                    message: ErrorMessage.USER_ALREADY_EXISTS,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // CREATE USER
            const userId = ulid()
            const { email, emailVerified, password, permissions } = body

            const newUser = await db.insert(users).values({
                id: userId,
                email,
                emailVerified,
                hashedPassword: await Bun.password.hash(password),
            })

            if (!newUser) {
                return handleResponse({
                    message: ErrorMessage.FAILED_TO_CREATE_USER,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }

            const emailToken = await jwtAccess.sign({
                id: userId,
            })

            const hashedToken = await Bun.password.hash(emailToken)

            if (!emailVerified) {
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
                    return handleResponse({
                        message:
                            ErrorMessage.FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN,
                        callback: () => {
                            set.status =
                                ResponseErrorStatus.INTERNAL_SERVER_ERROR
                        },
                        path,
                    })
                }

                const emailResponse = await sendEmail(
                    email,
                    "Verify your email",
                    verifyEmailTemplate(emailToken),
                )

                if (!emailResponse) {
                    return handleResponse({
                        message: ErrorMessage.FAILED_TO_SEND_EMAIL,
                        callback: () => {
                            set.status =
                                ResponseErrorStatus.INTERNAL_SERVER_ERROR
                        },
                        path,
                    })
                }
            }

            // CREATE USER PERMISSIONS
            if (permissions) {
                for (const permission of permissions) {
                    await db.insert(userPermissions).values({
                        id: ulid(),
                        userId: userId,
                        permissionId: permission,
                    })
                }
            }

            return handleResponse({
                message: SuccessMessage.USER_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                path,
            })
        },
        {
            body: "createUserModel",
        },
    )
