import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { getPermissionModel } from "@/src/permissions/delivery/dto/permission_request"
import { PermissionUsecase } from "@/src/permissions/domain/usecase"

export const getPermission = new Elysia()
    .use(getPermissionModel)
    .use(requirePermission(ManagePermission.READ_PERMISSION))
    .get("/permission/:id", {
        params: "getPermissionModel",
    }, async ({ params, set }) => {
        const path = "permissions.read.usecase"

        return runService(PermissionUsecase.get(params.id), {
            set,
            path,
            success: {
                message: SuccessMessage.PERMISSION_READ,
                status: ResponseSuccessStatus.OK,
                data: (result) => result,
            },
        })
    })
