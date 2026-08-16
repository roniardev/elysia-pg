import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const readUserPermission = new Elysia()
    .use(readUserPermissionModel)
    .use(requirePermission(ManageUserPermission.READ_USER_PERMISSION))
    .get(
        "/user-permission/:id",
        async ({ params, set }) => {
            const path = "user-permissions.read.usecase"

            const result = await Effect.runPromise(
                Effect.either(UserPermissionService.read(params.id)),
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
                message: SuccessMessage.USER_PERMISSION_READ,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right,
                path,
            })
        },
        {
            params: "readUserPermissionModel",
        },
    )
