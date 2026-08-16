import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import {
    readPermissionModel,
    updatePermissionModel,
} from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const updatePermission = new Elysia()
    .use(updatePermissionModel)
    .use(readPermissionModel)
    .use(requirePermission(ManagePermission.UPDATE_PERMISSION))
    .put(
        "/permission/:id",
        async ({ params, body, set, store }) => {
            const path = "permissions.update.usecase"
            const { userId } = store.auth

            const result = await Effect.runPromise(
                Effect.either(
                    PermissionService.update(params.id, body, userId),
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
                message: SuccessMessage.PERMISSION_UPDATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right,
                path,
            })
        },
        {
            params: "readPermissionModel",
            body: "updatePermissionModel",
        },
    )
