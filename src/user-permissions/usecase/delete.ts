import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deleteUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"

export const deleteUserPermission = new Elysia()
    .use(deleteUserPermissionModel)
    .use(requirePermission(ManageUserPermission.DELETE_USER_PERMISSION))
    .delete(
        "/user-permission/:id",
        async ({ params, set, store }) => {
            const path = "user-permissions.delete.usecase"
            const { userId } = store.auth

            return runService(UserPermissionService.delete(params.id, userId), {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_PERMISSION_DELETED,
                    status: ResponseSuccessStatus.OK,
                },
            })
        },
        {
            params: "deleteUserPermissionModel",
        },
    )
