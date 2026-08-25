import { Effect } from "effect"
import { SignJWT } from "jose"
import { ulid } from "ulid"

import { config } from "@/app/config"
import { verifyEmailTemplate } from "@/common/email-templates/verify-email"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import RegexPattern from "@/common/regex-pattern"
import { db } from "@/db"
import { emailVerificationTokens, users } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { getUser } from "@/src/general/usecase/get-user"
import { sendEmail } from "@/utils/send-email"
import { verrou } from "@/utils/services/locks"

export type RegisterInput = {
    email: string;
    password: string;
    confirmPassword: string;
}

export const register = (input: RegisterInput) =>
    Effect.gen(function* () {
        const { email, password, confirmPassword } = input

        if (!email.match(RegexPattern.EMAIL)) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INVALID_CREDENTIALS,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        if (password !== confirmPassword) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.PASSWORD_DO_NOT_MATCH,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        // CHECK EXISTING USER
        const existingUser = yield* Effect.tryPromise({
            try: () =>
                getUser({
                    identifier: email,
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

        if (existingUser.valid) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_ALREADY_EXISTS,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        const userId = ulid()

        // CREATE USER — hashed under a lock keyed by email so two
        // concurrent registrations can not both insert a new row
        let didAcquire = false
        yield* Effect.tryPromise({
            try: async () => {
                const hashedPassword = await Bun.password.hash(password)
                const [acquired] = await verrou
                    .createLock(`${email}:register`)
                    .run(async () => {
                        await db.insert(users).values({
                            id: userId,
                            email,
                            emailVerified: false,
                            hashedPassword,
                        })
                    })
                didAcquire = acquired
            },
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!didAcquire) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_ALREADY_EXISTS,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        const emailToken = yield* Effect.tryPromise({
            try: () =>
                new SignJWT({ id: userId })
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime("25m")
                    .sign(new TextEncoder().encode(config.JWT_EMAIL_SECRET)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const hashedToken = yield* Effect.tryPromise({
            try: () => Bun.password.hash(emailToken),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        // CREATE EMAIL VERIFICATION TOKEN
        yield* Effect.tryPromise({
            try: () =>
                db.insert(emailVerificationTokens).values({
                    id: ulid(),
                    email,
                    userId,
                    hashedToken,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const emailResponse = yield* Effect.tryPromise({
            try: () =>
                sendEmail(email, "Verify your email", verifyEmailTemplate(emailToken)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!emailResponse) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                ),
            )
        }

        return null
    })
