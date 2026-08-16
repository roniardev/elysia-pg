import { Redis } from "ioredis"
import { config } from "@/app/config"

export const redis = new Redis({
    host: config.REDIS_HOST,
})
