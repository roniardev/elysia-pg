import { Effect, Layer } from "effect"
import { jwtVerify, SignJWT } from "jose"

import type { config } from "@/app/config"
import {
    AuthTokenError,
    AuthTokens,
} from "@/src/auth/domain/repository/auth_token_service"
import { UserId } from "@/src/general/domain/entity-id"
import ExpiredTime from "@/utils/expired-time"
import { isUlid } from "@/utils/ulid"

export const makeAuthTokenLayer = (configuration: typeof config) =>
    Layer.succeed(AuthTokens, {
        sign: (userId, kind) => Effect.tryPromise({
            try: () => {
                let expiration: number | string = "15m"
                let secret = configuration.JWT_EMAIL_SECRET

                if (kind === "registrationEmail") {
                    expiration = "25m"
                }

                if (kind === "access") {
                    expiration = ExpiredTime.getExpiredAccessToken()
                    secret = configuration.JWT_ACCESS_SECRET
                }

                if (kind === "refresh") {
                    expiration = ExpiredTime.getExpiredRefreshToken()
                    secret = configuration.JWT_REFRESH_SECRET
                }

                return new SignJWT({ id: userId })
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime(expiration)
                    .sign(new TextEncoder().encode(secret))
            },
            catch: (cause) => new AuthTokenError({ cause }),
        }),
        verify: (token, kind) => Effect.tryPromise({
            try: async () => {
                let secret = configuration.JWT_EMAIL_SECRET

                if (kind === "access") {
                    secret = configuration.JWT_ACCESS_SECRET
                }

                if (kind === "refresh") {
                    secret = configuration.JWT_REFRESH_SECRET
                }

                const verified = await jwtVerify<{ id: string }>(
                    token,
                    new TextEncoder().encode(secret),
                )
                if (!isUlid(verified.payload.id)) {
                    throw new Error("Token subject is not a ULID")
                }

                return UserId(verified.payload.id)
            },
            catch: (cause) => new AuthTokenError({ cause }),
        }),
    })
