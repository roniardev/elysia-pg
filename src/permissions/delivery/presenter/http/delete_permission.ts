import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { deletePermissionModel } from "@/src/permissions/delivery/dto/permission_request"
import { PermissionUsecase } from "@/src/permissions/domain/usecase"

export const deletePermission = new Elysia()
    .use(deletePermissionModel)
    .use(requirePermission(ManagePermission.DELETE_PERMISSION))
    .delete(
        "/permission/:id",
        async ({ params, set, store }) => {
            const path = "permissions.delete.usecase"
            const { userId } = store.auth

            return runService(
                PermissionUsecase.delete(params.id, userId),
                {
                    set,
                    path,
                    success: {
                        message: SuccessMessage.PERMISSION_DELETED,
                        status: ResponseSuccessStatus.OK,
                    },
                },
            )
        },
        {
            params: "deletePermissionModel",
        },
    )
