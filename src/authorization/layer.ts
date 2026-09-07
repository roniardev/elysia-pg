import type { Database } from "@/db/database"
import { makeAuthorizationRepositoryLayer } from "@/src/authorization/data/repository/authorization_repository_impl"
import type { RedisClient } from "@/utils/services/redis-client"

export const makeAuthorizationLayer = (
    database: Database,
    redis: RedisClient,
) => makeAuthorizationRepositoryLayer(database, redis)
