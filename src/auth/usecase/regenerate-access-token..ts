import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { regenerateAccessTokenModel } from "@/src/auth/data/auth.model"
import { jwtAccessSetup, jwtRefreshSetup } from "@/src/auth/setup/auth"
import { getUser } from "@/src/general/usecase/get-user"
import { storeSession } from "@/src/general/usecase/store-session"
import ExpiredTime from "@/utils/expired-time"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"
import { redis } from "@/utils/services/redis"

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

            // CHECK EXISTING SESSION
            const existingRefreshToken = await redis.get(
                `${validToken.id}:refreshToken`,
            )

            if (!existingRefreshToken || bearer !== existingRefreshToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.UNAUTHORIZED
                    },
                    path,
                })
            }

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: validToken.id,
                type: "id",
            })

            if (!existingUser.user) {
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
                exp: ExpiredTime.getExpiredRefreshToken(),
            })

            const accessToken = await jwtAccess.sign({
                id: String(validToken.id),
                exp: ExpiredTime.getExpiredAccessToken(),
            })

            try {
                const [didAcquire] = await verrou
                    .createLock(`${validToken.id}:regenerate-access-token`)
                    .run(async () => {
                        await storeSession(
                            validToken.id,
                            accessToken,
                            refreshToken,
                        )
                    })

                if (!didAcquire) {
                    return handleResponse({
                        message: ErrorMessage.INTERNAL_SERVER_ERROR,
                        callback: () => {
                            set.status =
                                ResponseErrorStatus.INTERNAL_SERVER_ERROR
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
