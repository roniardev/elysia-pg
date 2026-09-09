import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { createPermissionModel } from "@/src/permissions/delivery/dto/permission_request"
import { PermissionUsecase } from "@/src/permissions/domain/usecase"

export const createPermission = new Elysia()
    .use(createPermissionModel)
    .use(requirePermission(ManagePermission.CREATE_PERMISSION))
    .post("/permission", {
        body: "createPermissionModel",
    }, async ({ body, set }) => {
        const path = "permissions.create.usecase"

        return runService(PermissionUsecase.create(body), {
            set,
            path,
            success: {
                message: SuccessMessage.PERMISSION_CREATED,
                status: ResponseSuccessStatus.CREATED,
                data: (result) => result,
            },
        })
    })
