import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import {
    readPermissionModel,
    updatePermissionModel,
} from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"

export const updatePermission = new Elysia()
    .use(updatePermissionModel)
    .use(readPermissionModel)
    .use(requirePermission(ManagePermission.UPDATE_PERMISSION))
    .put(
        "/permission/:id",
        async ({ params, body, set, store }) => {
            const path = "permissions.update.usecase"
            const { userId } = store.auth

            return runService(
                PermissionService.update(params.id, body, userId),
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
        },
        {
            params: "readPermissionModel",
            body: "updatePermissionModel",
        },
    )
