import { eq } from "drizzle-orm"
import { Effect } from "effect"
import { jwtVerify } from "jose"

import { config } from "@/app/config"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { users } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { AuthDatabaseService } from "@/src/auth/service/auth-database"
import { getUser } from "@/src/general/usecase/get-user"
import { verrou } from "@/utils/services/locks"

export type ResetPasswordInput = {
    token: string
    password: string
    confirmPassword: string
}

export const resetPassword = (input: ResetPasswordInput) =>
    Effect.gen(function* () {
        const database = yield* AuthDatabaseService
        const { password, confirmPassword } = input

        // CHECK VALID TOKEN
        const emailToken = yield* Effect.tryPromise({
            try: () =>
                jwtVerify<{ id: string }>(
                    input.token,
                    new TextEncoder().encode(config.JWT_EMAIL_SECRET),
                ),
            catch: () =>
                new ServiceError(
                    ErrorMessage.INVALID_EMAIL_TOKEN,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
        })

        // CHECK EXISTING USER
        const existingUser = yield* Effect.tryPromise({
            try: () =>
                getUser({
                    database,
                    identifier: emailToken.payload.id,
                    type: "id",
                    condition: { deleted: false },
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingUser?.user) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        // CHECK EXISTING PASSWORD RESET TOKEN
        const existingToken = yield* Effect.tryPromise({
            try: () =>
                database.query.passwordResetTokens.findFirst({
                    where: (table, { eq, and }) =>
                        and(
                            eq(table.userId, emailToken.payload.id),
                            eq(table.revoked, false),
                        ),
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingToken) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INVALID_EMAIL_TOKEN,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        // CHECK PASSWORD RESET TOKEN
        const validToken = yield* Effect.tryPromise({
            try: () =>
                Bun.password.verify(
                    input.token,
                    existingToken.hashedToken || "",
                ),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!validToken) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INVALID_EMAIL_TOKEN,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        const isExpired = existingToken.expiresAt < new Date()

        if (isExpired) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.EMAIL_TOKEN_EXPIRED,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        if (existingToken.revoked) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INVALID_EMAIL_TOKEN,
                    ResponseErrorStatus.FORBIDDEN,
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

        const hashedPassword = yield* Effect.tryPromise({
            try: () => Bun.password.hash(password),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        // UPDATE USER PASSWORD
        yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`${existingUser.user?.id}:reset-password`)
                    .run(async () => {
                        await database
                            .update(users)
                            .set({ hashedPassword })
                            .where(eq(users.id, String(existingUser.user?.id)))
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
