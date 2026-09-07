import { Context, Effect, Layer, ManagedRuntime } from "effect"

import { makeDatabase, type Database } from "@/db/database"
import { makeAuthLayer } from "@/src/auth/layer"
import { makeAuthorizationLayer } from "@/src/authorization/layer"
import { makePermissionLayer } from "@/src/permissions/layer"
import { makePostLayer } from "@/src/posts/layer"
import { makeUserPermissionLayer } from "@/src/user-permissions/layer"
import { makeUserLayer } from "@/src/users/layer"
import { makeLocks, type Locks } from "@/utils/services/lock-manager"
import { makeRedis, type RedisClient } from "@/utils/services/redis-client"

export type ApplicationResourcesService = {
    database: Database
    locks: Locks
    redis: RedisClient
}

export const ApplicationResources =
    Context.GenericTag<ApplicationResourcesService>("ApplicationResources")

const acquireResources = Effect.acquireRelease(
    Effect.sync(() => {
        const database = makeDatabase()
        const redis = makeRedis()

        return {
            database: database.database,
            locks: makeLocks(redis),
            redis,
            closeDatabase: database.close,
        }
    }),
    ({ closeDatabase, redis }) =>
        Effect.promise(async () => {
            await Promise.all([
                closeDatabase(),
                redis.quit(),
            ])
        }),
)

export const ApplicationLayer = Layer.unwrapScoped(
    acquireResources.pipe(
        Effect.map((resources) => {
            const resourceLayer = Layer.succeed(ApplicationResources, resources)

            return Layer.mergeAll(
                resourceLayer,
                makeAuthLayer(
                    resources.database,
                    resources.locks,
                    resources.redis,
                ),
                makeAuthorizationLayer(resources.database, resources.redis),
                makePermissionLayer(resources.database, resources.locks),
                makePostLayer(resources.database, resources.locks),
                makeUserLayer(resources.database, resources.locks),
                makeUserPermissionLayer(resources.database, resources.locks),
            )
        }),
    ),
)

export type ApplicationRequirements = Layer.Layer.Success<
    typeof ApplicationLayer
>

const runtime = ManagedRuntime.make(ApplicationLayer)

export const runApplicationEffect = runtime.runPromise

export const initializeApplicationResources = () =>
    runtime.runPromise(Effect.asVoid(ApplicationResources))

export const closeApplicationResources = () => runtime.dispose()
