import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { getUser } from "@/src/general/usecase/get-user"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { readUserModel } from "../data/users.model"

export const readUser = new Elysia()
    .use(readUserModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .get(
        "/user/:id",
        async ({ params, bearer, set, jwtAccess }) => {
            const path = "users.read.usecase"
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            const { valid } = await verifyPermission(
                UserPermission.READ_USER,
                validToken.id,
            )

            if (!valid) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED_PERMISSION,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            const user = await getUser({
                identifier: params.id,
                type: "id",
                extend: {
                    permissions: true,
                },
            })

            if (!user.user) {
                return handleResponse({
                    message: ErrorMessage.USER_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            const data = {
                id: user.user.id,
                email: user.user.email,
                emailVerified: user.user.emailVerified,
                permissions: user.user.permissions,
            }

            return handleResponse({
                message: SuccessMessage.USER_FOUND,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: data,
                path,
            })
        },
        {
            params: "readUserModel",
        },
    )
