import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deletePermissionModel } from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const deletePermission = new Elysia()
    .use(deletePermissionModel)
    .use(requirePermission(ManagePermission.DELETE_PERMISSION))
    .delete(
        "/permission/:id",
        async ({ params, set, store }) => {
            const path = "permissions.delete.usecase"
            const { userId } = store.auth

            const result = await Effect.runPromise(
                Effect.either(PermissionService.delete(params.id, userId)),
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
                message: SuccessMessage.PERMISSION_DELETED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            params: "deletePermissionModel",
        },
    )
