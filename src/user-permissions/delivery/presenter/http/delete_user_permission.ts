import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { readAuthStore, requirePermission } from "@/src/authorization/delivery/require_permission"
import { deleteUserPermissionModel } from "@/src/user-permissions/delivery/dto/user_permission_request"
import { UserPermissionUsecase } from "@/src/user-permissions/domain/usecase"

export const deleteUserPermission = new Elysia()
    .use(deleteUserPermissionModel)
    .use(requirePermission(ManageUserPermission.DELETE_USER_PERMISSION))
    .delete("/user-permission/:id", {
        params: "deleteUserPermissionModel",
    }, async ({ params, set, store }) =>
        runService(UserPermissionUsecase.delete(
            params.id,
            readAuthStore(store).userId,
        ), {
            set,
            path: "user-permissions.delete.usecase",
            success: {
                message: SuccessMessage.USER_PERMISSION_DELETED,
                status: ResponseSuccessStatus.OK,
            },
        }))
