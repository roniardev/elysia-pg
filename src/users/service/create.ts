import { Effect } from "effect"
import { SignJWT } from "jose"
import { ulid } from "ulid"

import { config } from "@/app/config"
import { verifyEmailTemplate } from "@/common/email-templates/verify-email"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { emailVerificationTokens, userPermissions, users } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { getUser } from "@/src/general/usecase/get-user"
import { sendEmail } from "@/utils/send-email"

export type CreateUserInput = {
    email: string
    password: string
    emailVerified?: boolean
    permissions?: string[]
}

export const createUser = (input: CreateUserInput) =>
    Effect.gen(function* () {
        // CHECK EXISTING USER
        const existingUser = yield* Effect.tryPromise({
            try: () =>
                getUser({
                    identifier: input.email,
                    type: "email",
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (existingUser.user) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_ALREADY_EXISTS,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        // PREPARE DATA — hashing and token signing stay outside the
        // transaction so DB locks are not held during CPU-bound work
        const userId = ulid()
        const { email, emailVerified, password, permissions } = input

        const hashedPassword = yield* Effect.tryPromise({
            try: () => Bun.password.hash(password),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.FAILED_TO_CREATE_USER,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const emailToken = yield* Effect.tryPromise({
            try: () =>
                new SignJWT({ id: userId })
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime("25m")
                    .sign(new TextEncoder().encode(config.JWT_ACCESS_SECRET)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const hashedToken = yield* Effect.tryPromise({
            try: () => Bun.password.hash(emailToken),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        // CREATE USER — every insert runs in one transaction; any failure
        // rolls back the whole batch, no partial user is left behind
        yield* Effect.tryPromise({
            try: () =>
                db.transaction(async (tx) => {
                    await tx.insert(users).values({
                        id: userId,
                        email,
                        emailVerified,
                        hashedPassword,
                    })

                    if (!emailVerified) {
                        await tx.insert(emailVerificationTokens).values({
                            id: ulid(),
                            email,
                            userId: userId,
                            hashedToken,
                            expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
                        })
                    }

                    if (permissions) {
                        for (const permission of permissions) {
                            await tx.insert(userPermissions).values({
                                id: ulid(),
                                userId: userId,
                                permissionId: permission,
                            })
                        }
                    }
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.FAILED_TO_CREATE_USER,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        // SEND EMAIL — external side effect, runs only after the
        // transaction commits, never inside it
        if (!emailVerified) {
            const emailResponse = yield* Effect.tryPromise({
                try: () =>
                    sendEmail(
                        email,
                        "Verify your email",
                        verifyEmailTemplate(emailToken),
                    ),
                catch: (error) => {
                    console.error(error)
                    return new ServiceError(
                        ErrorMessage.FAILED_TO_SEND_EMAIL,
                        ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                    )
                },
            })

            if (!emailResponse) {
                return yield* Effect.fail(
                    new ServiceError(
                        ErrorMessage.FAILED_TO_SEND_EMAIL,
                        ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                    ),
                )
            }
        }

        return { id: userId }
    })
