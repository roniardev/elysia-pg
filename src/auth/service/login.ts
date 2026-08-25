import { Effect } from "effect"
import { SignJWT } from "jose"

import { config } from "@/app/config"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import RegexPattern from "@/common/regex-pattern"
import { ServiceError } from "@/src/general/service-error"
import { getUser } from "@/src/general/usecase/get-user"
import { storeSession } from "@/src/general/usecase/store-session"
import ExpiredTime from "@/utils/expired-time"
import { verrou } from "@/utils/services/locks"
import { redis } from "@/utils/services/redis"

export type LoginInput = {
    email: string;
    password: string;
}

export type LoginResult = {
    accessToken: string;
    refreshToken: string;
}

export const login = (input: LoginInput) =>
    Effect.gen(function* () {
        const isValidEmail = input.email.match(RegexPattern.EMAIL)

        if (!isValidEmail) {
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
                    identifier: input.email,
                    type: "email",
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

        if (!existingUser.valid || !existingUser.user) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INVALID_CREDENTIALS,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        const { user } = existingUser

        if (!user.emailVerified) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.EMAIL_NOT_VERIFIED,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        // CHECK VALID PASSWORD
        const validPassword = yield* Effect.tryPromise({
            try: () => Bun.password.verify(input.password, user.hashedPassword || ""),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!validPassword) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.INVALID_CREDENTIALS,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        // CHECK EXISTING REFRESH TOKEN
        const existingRefreshToken = yield* Effect.tryPromise({
            try: () => redis.get(`${user.id}:refreshToken`),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (existingRefreshToken) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.SESSION_ALREADY_EXISTS,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        // GENERATE REFRESH TOKEN & ACCESS TOKEN
        const refreshToken = yield* Effect.tryPromise({
            try: () =>
                new SignJWT({ id: user.id })
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime(ExpiredTime.getExpiredRefreshToken())
                    .sign(new TextEncoder().encode(config.JWT_REFRESH_SECRET)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const accessToken = yield* Effect.tryPromise({
            try: () =>
                new SignJWT({ id: user.id })
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime(ExpiredTime.getExpiredAccessToken())
                    .sign(new TextEncoder().encode(config.JWT_ACCESS_SECRET)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        // STORE SESSION
        let didAcquire = false
        yield* Effect.tryPromise({
            try: async () => {
                const [acquired] = await verrou
                    .createLock(`${user.id}:login`)
                    .run(async () => {
                        await storeSession(user.id, accessToken, refreshToken)
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
                    ErrorMessage.SESSION_ALREADY_EXISTS,
                    ResponseErrorStatus.FORBIDDEN,
                ),
            )
        }

        return { accessToken, refreshToken }
    })
