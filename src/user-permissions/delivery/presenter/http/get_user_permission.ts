import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { getUserPermissionModel } from "@/src/user-permissions/delivery/dto/user_permission_request"
import { UserPermissionUsecase } from "@/src/user-permissions/domain/usecase"

export const getUserPermission = new Elysia()
    .use(getUserPermissionModel)
    .use(requirePermission(ManageUserPermission.READ_USER_PERMISSION))
    .get("/user-permission/:id", {
        params: "getUserPermissionModel",
    }, async ({ params, set }) =>
        runService(UserPermissionUsecase.get(params.id), {
            set,
            path: "user-permissions.read.usecase",
            success: {
                message: SuccessMessage.USER_PERMISSION_READ,
                status: ResponseSuccessStatus.OK,
                data: (result) => result,
            },
        }))
