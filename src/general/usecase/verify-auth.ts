import type { JWTPayloadSpec } from "@elysiajs/jwt"
import dayjs from "dayjs"

import { redis } from "@/utils/services/redis"

export const verifyAuth = async (
    bearer: string | undefined,
    token: { id?: string } & JWTPayloadSpec,
): Promise<boolean> => {
    if (!bearer) {
        return false
    }

    if (!token.id) {
        return false
    }

    const existingRefreshToken = await redis.get(`${token.id}:refreshToken`)

    if (!existingRefreshToken) {
        return false
    }

    const existingAccessToken = await redis.get(`${token.id}:accessToken`)

    if (!existingAccessToken) {
        return false
    }

    if (token.exp && token.exp < dayjs().unix()) {
        return false
    }

    return bearer === existingAccessToken
}
