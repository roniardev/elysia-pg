import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { basicAuthModel } from "@/src/auth/data/auth.model"
import { jwtAccessSetup, jwtRefreshSetup } from "@/src/auth/setup/auth"
import { verifyAuth } from "@/src/general/usecase/verify-auth"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"
import { redis } from "@/utils/services/redis"

export const logout = new Elysia()
    .use(basicAuthModel)
    .use(jwtAccessSetup)
    .use(jwtRefreshSetup)
    .use(bearer())
    .post("/logout", async function handler({ bearer, set, jwtAccess }) {
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
        const isAuthorized = await verifyAuth(bearer, validToken)

        if (!isAuthorized) {
            return handleResponse({
                message: ErrorMessage.UNAUTHORIZED,
                callback: () => {
                    set.status = ResponseErrorStatus.UNAUTHORIZED
                },
                path,
            })
        }

        // DELETE REFRESH & ACCESS TOKEN FROM REDIS
        try {
            const [didAcquire] = await verrou
                .createLock(`${validToken.id}:logout`)
                .run(async () => {
                    await redis.del(`${validToken.id}:refreshToken`)
                    await redis.del(`${validToken.id}:accessToken`)
                })

            if (!didAcquire) {
                return handleResponse({
                    message: ErrorMessage.INTERNAL_SERVER_ERROR,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }
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
            message: SuccessMessage.LOGOUT_SUCCESS,
            callback: () => {
                set.status = ResponseSuccessStatus.ACCEPTED
            },
            path,
        })
    })
