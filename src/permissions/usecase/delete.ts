import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deletePermissionModel } from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"

export const deletePermission = new Elysia()
    .use(deletePermissionModel)
    .use(requirePermission(ManagePermission.DELETE_PERMISSION))
    .delete(
        "/permission/:id",
        async ({ params, set, store }) => {
            const path = "permissions.delete.usecase"
            const { userId } = store.auth

            return runService(PermissionService.delete(params.id, userId), {
                set,
                path,
                success: {
                    message: SuccessMessage.PERMISSION_DELETED,
                    status: ResponseSuccessStatus.OK,
                },
            })
        },
        {
            params: "deletePermissionModel",
        },
    )
