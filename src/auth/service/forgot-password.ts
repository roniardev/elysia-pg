import { Effect } from "effect"
import { SignJWT } from "jose"
import { ulid } from "ulid"

import { config } from "@/app/config"
import { resetPasswordTemplate } from "@/common/email-templates/reset-password"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import RegexPattern from "@/common/regex-pattern"
import { db } from "@/db"
import { passwordResetTokens } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { getUser } from "@/src/general/usecase/get-user"
import { sendEmail } from "@/utils/send-email"
import { verrou } from "@/utils/services/locks"

export type ForgotPasswordInput = {
    email: string;
}

export const forgotPassword = (input: ForgotPasswordInput) =>
    Effect.gen(function* () {
        const { email } = input

        if (!email.match(RegexPattern.EMAIL)) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INVALID_CREDENTIALS,
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
                    condition: { deleted: false, emailVerified: true },
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingUser.valid) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        const { user } = existingUser

        const emailToken = yield* Effect.tryPromise({
            try: () =>
                new SignJWT({ id: String(user?.id) })
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime("15m")
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

        // CREATE PASSWORD RESET TOKEN
        yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`${email}:forgot-password:${user?.id}:generateToken`)
                    .run(async () => {
                        await db.insert(passwordResetTokens).values({
                            id: ulid(),
                            userId: String(user?.id),
                            hashedToken,
                            expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1 HOUR,
                        })
                    }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        // SEND EMAIL
        yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`${email}:forgot-password:${user?.id}:sendEmail`)
                    .run(async () => {
                        await sendEmail(
                            email,
                            "Reset your password",
                            resetPasswordTemplate(emailToken),
                        )
                    }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return null
    })
