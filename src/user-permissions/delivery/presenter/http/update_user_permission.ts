import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { readAuthStore, requirePermission } from "@/src/authorization/delivery/require_permission"
import {
    getUserPermissionModel,
    updateUserPermissionModel,
} from "@/src/user-permissions/delivery/dto/user_permission_request"
import { UserPermissionUsecase } from "@/src/user-permissions/domain/usecase"

export const updateUserPermission = new Elysia()
    .use(updateUserPermissionModel)
    .use(getUserPermissionModel)
    .use(requirePermission(ManageUserPermission.UPDATE_USER_PERMISSION))
    .patch("/user-permission/:id", {
        params: "getUserPermissionModel",
        body: "updateUserPermissionModel",
    }, async ({ params, body, set, store }) =>
        runService(UserPermissionUsecase.update(
            params.id,
            body,
            readAuthStore(store).userId,
        ), {
            set,
            path: "user-permissions.update.usecase",
            success: {
                message: SuccessMessage.USER_PERMISSION_UPDATED,
                status: ResponseSuccessStatus.OK,
                data: (result) => result,
            },
        }))
