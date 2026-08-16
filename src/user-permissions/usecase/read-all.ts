import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"

export const readAllUserPermission = new Elysia()
    .use(readAllUserPermissionModel)
    .use(requirePermission(ManageUserPermission.READ_USER_PERMISSION))
    .get(
        "/user-permission",
        async ({ query, set }) => {
            const path = "user-permissions.read-all.usecase"

            return runService(UserPermissionService.readAll(query), {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_PERMISSIONS_FETCHED,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result.data,
                    attributes: (result) => result.attributes,
                },
            })
        },
        {
            query: "readAllUserPermissionModel",
        },
    )
