import bearer from "@elysiajs/bearer"
import dayjs from "dayjs"
import { Elysia } from "elysia"

import { config } from "@/app/config"
import { redis } from "@/utils/services/redis"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { handleResponse } from "@/utils/handle-response"
import { regenerateAccessTokenModel } from "../data/auth.model"
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth"

export const regenerateAccessToken = new Elysia()
    .use(jwtRefreshSetup)
    .use(jwtAccessSetup)
    .use(regenerateAccessTokenModel)
    .use(bearer())
    .get(
        "/regenerate-access-token",
        async ({ set, jwtRefresh, bearer, jwtAccess }) => {
            const path = "auth.regenerate-access-token.usecase"
            // CHECK VALID TOKEN
            const validToken = await jwtRefresh.verify(bearer)

            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.UNAUTHORIZED
                    },
                    path,
                })
            }

            const refreshToken = await jwtRefresh.sign({
                id: validToken.id,
                exp: dayjs().unix() + config.REFRESH_TOKEN_EXPIRE_TIME,
            })

            const accessToken = await jwtAccess.sign({
                id: String(validToken.id),
                exp: dayjs().unix() + config.ACCESS_TOKEN_EXPIRE_TIME,
            })

            // SET REFRESH & ACCESS TOKEN TO REDIS
            try {
                await redis.set(`${validToken.id}:refreshToken`, refreshToken)

                await redis.expire(
                    `${validToken.id}:refreshToken`,
                    config.REFRESH_TOKEN_EXPIRE_TIME,
                )

                await redis.set(`${validToken.id}:accessToken`, accessToken)

                await redis.expire(
                    `${validToken.id}:accessToken`,
                    config.ACCESS_TOKEN_EXPIRE_TIME,
                )
            } catch (error) {
                console.error(error)

                return handleResponse({
                    message: ErrorMessage.INTERNAL_SERVER_ERROR,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.ACCESS_TOKEN_REGENERATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: {
                    accessToken,
                    refreshToken,
                },
                path,
            })
        },
    )
