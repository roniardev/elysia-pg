import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"

export const createUserPermission = new Elysia()
    .use(createUserPermissionModel)
    .use(requirePermission(ManageUserPermission.CREATE_USER_PERMISSION))
    .post(
        "/user-permission",
        async ({ body, set }) => {
            const path = "user-permissions.create.usecase"

            return runService(UserPermissionService.create(body), {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_PERMISSION_CREATED,
                    status: ResponseSuccessStatus.CREATED,
                    data: (result) => result,
                },
            })
        },
        {
            body: "createUserPermissionModel",
        },
    )
