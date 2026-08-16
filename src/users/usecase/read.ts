import { Effect } from "effect"
import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readUserModel } from "@/src/users/data/users.model"
import { UserService } from "@/src/users/service"
import { handleResponse } from "@/utils/handle-response"

export const readUser = new Elysia()
    .use(readUserModel)
    .use(requirePermission(UserPermission.READ_USER))
    .get(
        "/user/:id",
        async ({ params, set }) => {
            const path = "users.read.usecase"

            const result = await Effect.runPromise(
                Effect.either(UserService.read(params.id)),
            )

            if (result._tag === "Left") {
                return handleResponse({
                    message: result.left.message,
                    callback: () => {
                        set.status = result.left.status
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.USER_FOUND,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right,
                path,
            })
        },
        {
            params: "readUserModel",
        },
    )
