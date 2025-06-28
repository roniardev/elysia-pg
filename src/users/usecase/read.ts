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
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
                    set.status = ResponseErrorStatus.FORBIDDEN
                })
            }

            const { valid } = await verifyPermission(
                UserPermission.READ_USER,
                validToken.id,
            )

            if (!valid) {
                return handleResponse(
                    ErrorMessage.UNAUTHORIZED_PERMISSION,
                    () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                )
            }

            const user = await getUser({
                identifier: params.id,
                type: "id",
                extend: {
                    permissions: true,
                },
            })

            if (!user.user) {
                return handleResponse(ErrorMessage.USER_NOT_FOUND, () => {
                    set.status = ResponseErrorStatus.NOT_FOUND
                })
            }

            const data = {
                id: user.user.id,
                email: user.user.email,
                emailVerified: user.user.emailVerified,
                permissions: user.user.permissions,
            }

            return handleResponse(
                SuccessMessage.USER_FOUND,
                () => {
                    set.status = ResponseSuccessStatus.OK
                },
                {
                    data: data,
                },
            )
        },
        {
            params: "readUserModel",
        },
    )
