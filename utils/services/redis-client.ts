import { Redis } from "ioredis"

import { config } from "@/app/config"

export const makeRedis = () =>
    new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
    })

export type RedisClient = ReturnType<typeof makeRedis>
