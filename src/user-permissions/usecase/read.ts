import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"

export const readUserPermission = new Elysia()
    .use(readUserPermissionModel)
    .use(requirePermission(ManageUserPermission.READ_USER_PERMISSION))
    .get(
        "/user-permission/:id",
        async ({ params, set }) => {
            const path = "user-permissions.read.usecase"

            return runService(UserPermissionService.read(params.id), {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_PERMISSION_READ,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result,
                },
            })
        },
        {
            params: "readUserPermissionModel",
        },
    )
