import { Elysia } from "elysia"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import RegexPattern from "@/common/regex-pattern"
import { basicAuthModel } from "@/src/auth/data/auth.model"
import { jwtAccessSetup, jwtRefreshSetup } from "@/src/auth/setup/auth"
import { getUser } from "@/src/general/usecase/get-user"
import { storeSession } from "@/src/general/usecase/store-session"
import ExpiredTime from "@/utils/expired-time"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"
import { redis } from "@/utils/services/redis"

export const login = new Elysia()
    .use(basicAuthModel)
    .use(jwtAccessSetup)
    .use(jwtRefreshSetup)
    .post(
        "/login",
        async function handler({ body, set, jwtAccess, jwtRefresh }) {
            const path = "auth.login.usecase"
            const isValidEmail = body.email.match(RegexPattern.EMAIL)

            if (!isValidEmail) {
                return handleResponse({
                    message: ErrorMessage.INVALID_CREDENTIALS,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: body.email,
                type: "email",
                condition: {
                    deleted: false,
                },
            })

            if (!existingUser.valid) {
                return handleResponse({
                    message: ErrorMessage.INVALID_CREDENTIALS,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            if (!existingUser.user) {
                return handleResponse({
                    message: ErrorMessage.INVALID_CREDENTIALS,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            if (!existingUser.user.emailVerified) {
                return handleResponse({
                    message: ErrorMessage.EMAIL_NOT_VERIFIED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // CHECK VALID PASSWORD
            const validPassword = await Bun.password.verify(
                body.password,
                existingUser.user.hashedPassword || "",
            )

            if (!validPassword) {
                return handleResponse({
                    message: ErrorMessage.INVALID_CREDENTIALS,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            const { user } = existingUser

            // CHECK EXISTING REFRESH TOKEN
            const existingRefreshToken = await redis.get(
                `${user.id}:refreshToken`,
            )

            if (existingRefreshToken) {
                return handleResponse({
                    message: ErrorMessage.SESSION_ALREADY_EXISTS,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // GENERATE REFRESH TOKEN & ACCESS TOKEN
            const refreshToken = await jwtRefresh.sign({
                id: user.id,
                exp: ExpiredTime.getExpiredRefreshToken(),
            })

            const accessToken = await jwtAccess.sign({
                id: user.id,
                exp: ExpiredTime.getExpiredAccessToken(),
            })

            try {
                const [didAcquire] = await verrou
                    .createLock(`${user.id}:login`)
                    .run(async () => {
                        await storeSession(user.id, accessToken, refreshToken)
                    })

                if (!didAcquire) {
                    return handleResponse({
                        message: ErrorMessage.SESSION_ALREADY_EXISTS,
                        callback: () => {
                            set.status = ResponseErrorStatus.FORBIDDEN
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
                message: SuccessMessage.LOGIN_SUCCESS,
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
        {
            body: "basicAuthModel",
        },
    )
