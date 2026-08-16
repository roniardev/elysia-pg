import { config } from "@/app/config"
import { redis } from "@/utils/services/redis"

export const storeSession = async (
    userId: string,
    accessToken: string,
    refreshToken: string,
) => {
    await redis.set(`${userId}:refreshToken`, refreshToken)
    await redis.expire(
        `${userId}:refreshToken`,
        config.REFRESH_TOKEN_EXPIRE_TIME,
    )

    await redis.set(`${userId}:accessToken`, accessToken)
    await redis.expire(`${userId}:accessToken`, config.ACCESS_TOKEN_EXPIRE_TIME)
}
