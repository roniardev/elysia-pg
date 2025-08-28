import { and, eq, isNull } from "drizzle-orm"
import { Elysia } from "elysia"

import dayjs from "dayjs"

import { config } from "@/app/config"
import ExpiredTime from "@/utils/expired-time"
import { verrou } from "@/utils/services/locks"
import { redis } from "@/utils/services/redis"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { getUser } from "@/src/general/usecase/get-user"
import { handleResponse } from "@/utils/handle-response"
import { basicAuthModel } from "../data/auth.model"
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth"
import RegexPattern from "@/common/regex-pattern"

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
                    verified: false,
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

            if (!existingUser.user?.emailVerified) {
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
                existingUser.user?.hashedPassword || "",
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

            // CHECK EXISTING REFRESH TOKEN
            const existingRefreshToken = await redis.get(
                `${existingUser.user?.id}:refreshToken`,
            )

            const existingAccessToken = await redis.get(
                `${existingUser.user?.id}:accessToken`,
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
                id: existingUser.user?.id,
                exp: ExpiredTime.getExpiredRefreshToken(),
            })

            const accessToken = await jwtAccess.sign({
                id: String(existingUser.user?.id),
                exp: dayjs().unix() + config.ACCESS_TOKEN_EXPIRE_TIME,
            })

            await verrou
                .createLock(`${existingUser.user?.id}:login`)
                .run(async () => {
                    // SET REFRESH TOKEN & ACCESS TOKEN TO REDIS
                    try {
                        await redis.set(
                            `${existingUser.user?.id}:refreshToken`,
                            refreshToken,
                        )

                        await redis.expire(
                            `${existingUser.user?.id}:refreshToken`,
                            config.REFRESH_TOKEN_EXPIRE_TIME,
                        )

                        await redis.set(
                            `${existingUser.user?.id}:accessToken`,
                            accessToken,
                        )

                        await redis.expire(
                            `${existingUser.user?.id}:accessToken`,
                            config.ACCESS_TOKEN_EXPIRE_TIME,
                        )
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
