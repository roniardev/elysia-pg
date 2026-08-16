import { Effect } from "effect"
import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deleteUserModel } from "@/src/users/data/users.model"
import { UserService } from "@/src/users/service"
import { handleResponse } from "@/utils/handle-response"

export const deleteUser = new Elysia()
    .use(deleteUserModel)
    .use(requirePermission(UserPermission.DELETE_USER))
    .delete(
        "/user/:id",
        async ({ set, params }) => {
            const path = "users.delete.usecase"

            const result = await Effect.runPromise(
                Effect.either(UserService.delete(params.id)),
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
                message: SuccessMessage.USER_DELETED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            params: "deleteUserModel",
        },
    )
