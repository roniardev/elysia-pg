import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { db } from "@/db"
import { verifyPermission } from "@/src/general/usecase/verify-permission"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { readAllUserModel } from "../data/users.model"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import { handleResponse } from "@/utils/handle-response"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"

export const readAllUser = new Elysia()
    .use(readAllUserModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .get(
        "/user",
        async ({ bearer, set, jwtAccess, query }) => {
            const path = "users.read-all.usecase"
            // CHECK VALID TOKEN
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse({
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    message: ErrorMessage.UNAUTHORIZED,
                    path,
                })
            }

            const { limit, page } = query

            const { valid } = await verifyPermission(
                UserPermission.READ_ALL_USER,
                validToken.id,
            )

            if (!valid) {
                return handleResponse({
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    message: ErrorMessage.UNAUTHORIZED_PERMISSION,
                    path,
                })
            }

            const users = await db.query.users.findMany({
                with: {
                    permissions: true,
                },
            })

            if (!users) {
                return handleResponse({
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    message: ErrorMessage.USER_NOT_FOUND,
                    path,
                })
            }

            const totalPage = Math.ceil(users.length / Number(limit))

            if (page > totalPage) {
                return handleResponse({
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    message: ErrorMessage.PAGE_NOT_FOUND,
                    path,
                })
            }

            const total = users.length

            return handleResponse({
                message: SuccessMessage.USER_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: users,
                path,
            })
        },
        {
            query: "readAllUserModel",
        },
    )
