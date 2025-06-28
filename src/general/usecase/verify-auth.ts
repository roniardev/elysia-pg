import type { JWTPayloadSpec } from "@elysiajs/jwt"
import dayjs from "dayjs"

import { ErrorMessage } from "@/common/enum/response-message"
import { redis } from "@/utils/services/redis"

export const verifyAuth = async (
    bearer: string,
    token: {
        id: string
    } & JWTPayloadSpec,
): Promise<{
    valid: boolean
    message: string
}> => {
    if (typeof token !== "object") {
        return {
            valid: false,
            message: ErrorMessage.UNAUTHORIZED,
        }
    }

    const existingRefreshToken = await redis.get(`${token.id}:refreshToken`)

    const existingAccessToken = await redis.get(`${token.id}:accessToken`)

    if (!existingRefreshToken || !existingAccessToken) {
        return {
            valid: false,
            message: ErrorMessage.UNAUTHORIZED,
        }
    }

    if (token?.exp && token.exp < dayjs().unix()) {
        return {
            valid: false,
            message: ErrorMessage.UNAUTHORIZED,
        }
    }

    if (bearer !== existingAccessToken) {
        return {
            valid: false,
            message: ErrorMessage.UNAUTHORIZED,
        }
    }

    if (!existingRefreshToken || !existingAccessToken) {
        return {
            valid: false,
            message: ErrorMessage.FORBIDDEN,
        }
    }

    return {
        valid: true,
        message: "Authorized",
    }
}
