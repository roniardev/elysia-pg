import { Effect } from "effect"
import { jwtVerify } from "jose"

import { config } from "@/app/config"
import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { ServiceError } from "@/src/general/service-error"
import { verifyAuth } from "@/src/general/usecase/verify-auth"
import { verrou } from "@/utils/services/locks"
import { redis } from "@/utils/services/redis"

export const logout = (bearerToken: string | undefined) =>
    Effect.gen(function* () {
        // CHECK VALID TOKEN
        const validToken = yield* Effect.tryPromise({
            try: () =>
                jwtVerify<{ id: string }>(
                    bearerToken || "",
                    new TextEncoder().encode(config.JWT_ACCESS_SECRET),
                ),
            catch: () =>
                new ServiceError(
                    ErrorMessage.UNAUTHORIZED,
                    ResponseErrorStatus.UNAUTHORIZED,
                ),
        })

        // CHECK EXISTING SESSION
        const isAuthorized = yield* Effect.tryPromise({
            try: () => verifyAuth(bearerToken, validToken.payload),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!isAuthorized) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.UNAUTHORIZED,
                    ResponseErrorStatus.UNAUTHORIZED,
                ),
            )
        }

        // DELETE REFRESH & ACCESS TOKEN FROM REDIS
        let didAcquire = false
        yield* Effect.tryPromise({
            try: async () => {
                const [acquired] = await verrou
                    .createLock(`${validToken.payload.id}:logout`)
                    .run(async () => {
                        await redis.del(`${validToken.payload.id}:refreshToken`)
                        await redis.del(`${validToken.payload.id}:accessToken`)
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

        return null
    })
