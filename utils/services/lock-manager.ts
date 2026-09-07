import { Verrou } from "@verrou/core"
import { memoryStore } from "@verrou/core/drivers/memory"
import { redisStore } from "@verrou/core/drivers/redis"

import type { RedisClient } from "@/utils/services/redis-client"

export const makeLocks = (connection: RedisClient) =>
    new Verrou({
        default: "redis",
        stores: {
            memory: { driver: memoryStore() },
            redis: { driver: redisStore({ connection }) },
        },
    })

export type Locks = ReturnType<typeof makeLocks>
