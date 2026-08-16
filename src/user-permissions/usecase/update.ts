import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import {
    readUserPermissionModel,
    updateUserPermissionModel,
} from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"

export const updateUserPermission = new Elysia()
    .use(updateUserPermissionModel)
    .use(readUserPermissionModel)
    .use(requirePermission(ManageUserPermission.UPDATE_USER_PERMISSION))
    .patch(
        "/user-permission/:id",
        async ({ params, body, set, store }) => {
            const path = "user-permissions.update.usecase"
            const { userId } = store.auth

            return runService(
                UserPermissionService.update(params.id, body, userId),
                {
                    set,
                    path,
                    success: {
                        message: SuccessMessage.USER_PERMISSION_UPDATED,
                        status: ResponseSuccessStatus.OK,
                        data: (result) => result,
                    },
                },
            )
        },
        {
            params: "readUserPermissionModel",
            body: "updateUserPermissionModel",
        },
    )
