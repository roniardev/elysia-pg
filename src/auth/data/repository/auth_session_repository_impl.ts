import { Effect, Layer } from "effect"

import type { config } from "@/app/config"
import {
    AuthSessionError,
    AuthSessionRepository,
} from "@/src/auth/domain/repository/auth_session_repository"
import type { Locks } from "@/utils/services/lock-manager"
import type { RedisClient } from "@/utils/services/redis-client"

const sessionError =
    (operation: AuthSessionError["operation"]) => (cause: unknown) =>
        new AuthSessionError({ cause, operation })

export const makeAuthSessionLayer = (
    cache: RedisClient,
    locks: Locks,
    configuration: typeof config,
) => Layer.succeed(AuthSessionRepository, {
    delete: (userId) => Effect.tryPromise({
        try: async () => {
            const result = await locks.createLock(`${userId}:logout`).run(
                async () => {
                    await cache.del(`${userId}:refreshToken`)
                    await cache.del(`${userId}:accessToken`)
                },
            )
            return result[0]
        },
        catch: sessionError("delete"),
    }),
    getAccess: (userId) => Effect.tryPromise({
        try: () => cache.get(`${userId}:accessToken`),
        catch: sessionError("getAccess"),
    }),
    getRefresh: (userId) => Effect.tryPromise({
        try: () => cache.get(`${userId}:refreshToken`),
        catch: sessionError("getRefresh"),
    }),
    store: (userId, session, lockName) => Effect.tryPromise({
        try: async () => {
            const result = await locks.createLock(lockName).run(async () => {
                await cache.set(`${userId}:refreshToken`, session.refreshToken)
                await cache.expire(
                    `${userId}:refreshToken`,
                    configuration.REFRESH_TOKEN_EXPIRE_TIME,
                )
                await cache.set(`${userId}:accessToken`, session.accessToken)
                await cache.expire(
                    `${userId}:accessToken`,
                    configuration.ACCESS_TOKEN_EXPIRE_TIME,
                )
            })
            return result[0]
        },
        catch: sessionError("store"),
    }),
})
