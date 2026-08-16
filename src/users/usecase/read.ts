import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { getUser } from "@/src/general/usecase/get-user"
import { readUserModel } from "@/src/users/data/users.model"
import { handleResponse } from "@/utils/handle-response"

export const readUser = new Elysia()
    .use(readUserModel)
    .use(requirePermission(UserPermission.READ_USER))
    .get(
        "/user/:id",
        async ({ params, set }) => {
            const path = "users.read.usecase"

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
