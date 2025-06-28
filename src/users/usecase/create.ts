import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { ulid } from "ulid"

import { UserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { emailVerificationTokens, userPermissions, users } from "@/db/schema"
import { getUser } from "@/src/general/usecase/get-user"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { verifyEmailTemplate } from "@/common/email-templates/verify-email"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { sendEmail } from "@/utils/send-email"
import { createUserModel } from "../data/users.model"

export const createUser = new Elysia()
    .use(createUserModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .post(
        "/user",
        async ({ body, bearer, set, jwtAccess }) => {
            // CHECK VALID TOKEN
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
                    set.status = ResponseErrorStatus.FORBIDDEN
                })
            }

            const { valid } = await verifyPermission(
                UserPermission.CREATE_USER,
                validToken.id,
            )

            if (!valid) {
                return handleResponse(
                    ErrorMessage.UNAUTHORIZED_PERMISSION,
                    () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                )
            }

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: body.email,
                type: "email",
            })

            if (existingUser.user) {
                return handleResponse(ErrorMessage.USER_ALREADY_EXISTS, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
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
                return handleResponse(
                    ErrorMessage.FAILED_TO_CREATE_USER,
                    () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                )
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
                    return handleResponse(
                        ErrorMessage.FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN,
                        () => {
                            set.status =
                                ResponseErrorStatus.INTERNAL_SERVER_ERROR
                        },
                    )
                }

                const emailResponse = await sendEmail(
                    email,
                    "Verify your email",
                    verifyEmailTemplate(emailToken),
                )

                if (!emailResponse) {
                    return handleResponse(
                        ErrorMessage.FAILED_TO_SEND_EMAIL,
                        () => {
                            set.status =
                                ResponseErrorStatus.INTERNAL_SERVER_ERROR
                        },
                    )
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

            return handleResponse(SuccessMessage.USER_CREATED, () => {
                set.status = ResponseSuccessStatus.CREATED
            })
        },
        {
            body: "createUserModel",
        },
    )
