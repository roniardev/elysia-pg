import { makeLocks } from "@/utils/services/lock-manager"
import { redis } from "@/utils/services/redis"

export const verrou = makeLocks(redis)
