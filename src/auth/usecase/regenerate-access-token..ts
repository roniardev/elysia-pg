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
            // CHECK VALID TOKEN
            const validToken = await jwtRefresh.verify(bearer)

            if (!validToken) {
                return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
                    set.status = ResponseErrorStatus.UNAUTHORIZED
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

                return handleResponse(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                )
            }

            return handleResponse(
                SuccessMessage.ACCESS_TOKEN_REGENERATED,
                () => {
                    set.status = ResponseSuccessStatus.OK
                },
                {
                    accessToken,
                    refreshToken,
                },
            )
        },
    )
