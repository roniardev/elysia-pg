import bearer from "@elysiajs/bearer"
import dayjs from "dayjs"
import { Elysia } from "elysia"

import { redis } from "@/utils/services/redis"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { handleResponse } from "@/utils/handle-response"
import { basicAuthModel } from "../data/auth.model"
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth"
import { verrou } from "@/utils/services/locks"

export const logout = new Elysia()
    .use(basicAuthModel)
    .use(jwtAccessSetup)
    .use(jwtRefreshSetup)
    .use(bearer())
    .post(
        "/logout",
        async function handler({ bearer, set, jwtAccess, jwtRefresh }) {
            const path = "auth.logout.usecase"
            // CHECK VALID TOKEN
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.UNAUTHORIZED
                    },
                    path,
                })
            }

            // CHECK EXISTING SESSION
            const existingRefreshToken = await redis.get(
                `${validToken.id}:refreshToken`,
            )

            const existingAccessToken = await redis.get(
                `${validToken.id}:accessToken`,
            )

            if (validToken?.exp && validToken.exp < dayjs().unix()) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.UNAUTHORIZED
                    },
                    path,
                })
            }

            if (bearer !== existingAccessToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.UNAUTHORIZED
                    },
                    path,
                })
            }

            if (!existingRefreshToken || !existingAccessToken) {
                return handleResponse({
                    message: ErrorMessage.FORBIDDEN,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // DELETE REFRESH & ACCESS TOKEN FROM REDIS
            await verrou.createLock(`${validToken.id}:logout`).run(async () => {
                // DELETE REFRESH & ACCESS TOKEN FROM REDIS
                try {
                    await redis.del(`${validToken.id}:refreshToken`)
                    await redis.del(`${validToken.id}:accessToken`)
                } catch (error) {
                    console.error(error)
                    return handleResponse({
                        message: ErrorMessage.INTERNAL_SERVER_ERROR,
                        callback: () => {
                            set.status =
                                ResponseErrorStatus.INTERNAL_SERVER_ERROR
                        },
                        path,
                    })
                }
            })

            return handleResponse({
                message: SuccessMessage.LOGOUT_SUCCESS,
                callback: () => {
                    set.status = ResponseSuccessStatus.ACCEPTED
                },
                path,
            })
        },
    )
