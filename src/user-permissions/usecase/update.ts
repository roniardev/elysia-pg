import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import {
    readUserPermissionModel,
    updateUserPermissionModel,
} from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const updateUserPermission = new Elysia()
    .use(updateUserPermissionModel)
    .use(readUserPermissionModel)
    .use(requirePermission(ManageUserPermission.UPDATE_USER_PERMISSION))
    .patch(
        "/user-permission/:id",
        async ({ params, body, set, store }) => {
            const path = "user-permissions.update.usecase"
            const { userId } = store.auth

            const result = await Effect.runPromise(
                Effect.either(
                    UserPermissionService.update(params.id, body, userId),
                ),
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
                message: SuccessMessage.USER_PERMISSION_UPDATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right,
                path,
            })
        },
        {
            params: "readUserPermissionModel",
            body: "updateUserPermissionModel",
        },
    )
