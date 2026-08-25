import { eq } from "drizzle-orm"
import { Effect } from "effect"
import { jwtVerify } from "jose"

import { config } from "@/app/config"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { emailVerificationTokens, users } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { getUser } from "@/src/general/usecase/get-user"
import { verrou } from "@/utils/services/locks"

export type VerifyEmailInput = {
    token: string;
}

export const verifyEmail = (input: VerifyEmailInput) =>
    Effect.gen(function* () {
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
                    ResponseErrorStatus.FORBIDDEN,
                ),
        })

        // CHECK EXISTING USER
        const existingUser = yield* Effect.tryPromise({
            try: () =>
                getUser({
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

        if (existingUser?.user?.emailVerified) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.EMAIL_ALREADY_VERIFIED,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        // CHECK EXISTING EMAIL VERIFICATION TOKEN
        const userToken = yield* Effect.tryPromise({
            try: () =>
                db.query.emailVerificationTokens.findFirst({
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

        const validToken = yield* Effect.tryPromise({
            try: () => Bun.password.verify(input.token, userToken?.hashedToken || ""),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!userToken || !validToken) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INVALID_EMAIL_TOKEN,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        const isExpired = userToken.expiresAt < new Date()

        if (isExpired) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.EMAIL_TOKEN_EXPIRED,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        // REVOKE EMAIL VERIFICATION TOKEN
        yield* Effect.tryPromise({
            try: () =>
                db
                    .update(emailVerificationTokens)
                    .set({ revoked: true })
                    .where(eq(emailVerificationTokens.id, userToken.id)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        // UPDATE USER EMAIL VERIFICATION
        yield* Effect.tryPromise({
            try: () =>
                verrou.createLock(`${userToken.userId}:verify-email`).run(async () => {
                    await db
                        .update(users)
                        .set({ emailVerified: true })
                        .where(eq(users.id, userToken.userId))
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
