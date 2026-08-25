import { Effect } from "effect"
import { jwtVerify, SignJWT } from "jose"

import { config } from "@/app/config"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { ServiceError } from "@/src/general/service-error"
import { getUser } from "@/src/general/usecase/get-user"
import { storeSession } from "@/src/general/usecase/store-session"
import ExpiredTime from "@/utils/expired-time"
import { verrou } from "@/utils/services/locks"
import { redis } from "@/utils/services/redis"

export type RegenerateAccessTokenResult = {
    accessToken: string;
    refreshToken: string;
}

export const regenerateAccessToken = (bearerToken: string | undefined) =>
    Effect.gen(function* () {
        // CHECK VALID TOKEN
        const validToken = yield* Effect.tryPromise({
            try: () =>
                jwtVerify<{ id: string }>(
                    bearerToken || "",
                    new TextEncoder().encode(config.JWT_REFRESH_SECRET),
                ),
            catch: () =>
                new ServiceError(
                    ErrorMessage.UNAUTHORIZED,
                    ResponseErrorStatus.UNAUTHORIZED,
                ),
        })

        // CHECK EXISTING SESSION
        const existingRefreshToken = yield* Effect.tryPromise({
            try: () => redis.get(`${validToken.payload.id}:refreshToken`),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingRefreshToken || bearerToken !== existingRefreshToken) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.UNAUTHORIZED,
                    ResponseErrorStatus.UNAUTHORIZED,
                ),
            )
        }

        // CHECK EXISTING USER
        const existingUser = yield* Effect.tryPromise({
            try: () =>
                getUser({
                    identifier: validToken.payload.id,
                    type: "id",
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingUser.user) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.UNAUTHORIZED,
                    ResponseErrorStatus.UNAUTHORIZED,
                ),
            )
        }

        // GENERATE REFRESH TOKEN & ACCESS TOKEN
        const refreshToken = yield* Effect.tryPromise({
            try: () =>
                new SignJWT({ id: validToken.payload.id })
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
                new SignJWT({ id: validToken.payload.id })
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
                    .createLock(`${validToken.payload.id}:regenerate-access-token`)
                    .run(async () => {
                        await storeSession(
                            validToken.payload.id,
                            accessToken,
                            refreshToken,
                        )
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
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                ),
            )
        }

        return { accessToken, refreshToken }
    })
