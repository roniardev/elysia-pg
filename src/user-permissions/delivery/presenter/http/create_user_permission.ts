import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { createUserPermissionModel } from "@/src/user-permissions/delivery/dto/user_permission_request"
import { UserPermissionUsecase } from "@/src/user-permissions/domain/usecase"

export const createUserPermission = new Elysia()
    .use(createUserPermissionModel)
    .use(requirePermission(ManageUserPermission.CREATE_USER_PERMISSION))
    .post("/user-permission", async ({ body, set }) =>
        runService(UserPermissionUsecase.create(body), {
            set,
            path: "user-permissions.create.usecase",
            success: {
                message: SuccessMessage.USER_PERMISSION_CREATED,
                status: ResponseSuccessStatus.CREATED,
                data: (result) => result,
            },
        }), {
        body: "createUserPermissionModel",
    })
