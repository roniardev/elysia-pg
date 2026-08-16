import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deleteUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const deleteUserPermission = new Elysia()
    .use(deleteUserPermissionModel)
    .use(requirePermission(ManageUserPermission.DELETE_USER_PERMISSION))
    .delete(
        "/user-permission/:id",
        async ({ params, set, store }) => {
            const path = "user-permissions.delete.usecase"
            const { userId } = store.auth

            const result = await Effect.runPromise(
                Effect.either(UserPermissionService.delete(params.id, userId)),
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
                message: SuccessMessage.USER_PERMISSION_DELETED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            params: "deleteUserPermissionModel",
        },
    )
