import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { getListUserPermissionModel } from "@/src/user-permissions/delivery/dto/user_permission_request"
import { UserPermissionUsecase } from "@/src/user-permissions/domain/usecase"

export const getListUserPermissions = new Elysia()
    .use(getListUserPermissionModel)
    .use(requirePermission(ManageUserPermission.READ_USER_PERMISSION))
    .get("/user-permission", {
        query: "getListUserPermissionModel",
    }, async ({ query, set }) =>
        runService(UserPermissionUsecase.getList(query), {
            set,
            path: "user-permissions.read-all.usecase",
            success: {
                message: SuccessMessage.USER_PERMISSIONS_FETCHED,
                status: ResponseSuccessStatus.OK,
                data: (result) => result.data,
                attributes: (result) => result.attributes,
            },
        }))
