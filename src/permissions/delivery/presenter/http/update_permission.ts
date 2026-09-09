import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { readAuthStore, requirePermission } from "@/src/authorization/delivery/require_permission"
import {
    getPermissionModel,
    updatePermissionModel,
} from "@/src/permissions/delivery/dto/permission_request"
import { PermissionUsecase } from "@/src/permissions/domain/usecase"

export const updatePermission = new Elysia()
    .use(updatePermissionModel)
    .use(getPermissionModel)
    .use(requirePermission(ManagePermission.UPDATE_PERMISSION))
    .put("/permission/:id", {
        params: "getPermissionModel",
        body: "updatePermissionModel",
    }, async ({ params, body, set, store }) => {
        const path = "permissions.update.usecase"
        const { userId } = readAuthStore(store)

        return runService(
            PermissionUsecase.update(params.id, body, userId),
            {
                set,
                path,
                success: {
                    message: SuccessMessage.PERMISSION_UPDATED,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result,
                },
            },
        )
    })
