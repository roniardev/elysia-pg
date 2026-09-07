import type { RedisClient } from "@/utils/services/redis-client"

export const verifyAuthorizationSession = async (
    cache: RedisClient,
    userId: string,
    accessToken: string,
    tokenExpiresAt?: number,
) => {
    const refreshToken = await cache.get(`${userId}:refreshToken`)

    if (!refreshToken) {
        return false
    }

    const existingAccessToken = await cache.get(`${userId}:accessToken`)

    if (!existingAccessToken) {
        return false
    }

    if (tokenExpiresAt && tokenExpiresAt < Math.floor(Date.now() / 1000)) {
        return false
    }

    return accessToken === existingAccessToken
}
