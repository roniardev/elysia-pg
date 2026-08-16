import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllPermissionModel } from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"

export const readAllPermission = new Elysia()
    .use(readAllPermissionModel)
    .use(requirePermission(ManagePermission.READ_ALL_PERMISSION))
    .get(
        "/permissions",
        async ({ query, set }) => {
            const path = "permissions.read-all.usecase"

            return runService(PermissionService.readAll(query), {
                set,
                path,
                success: {
                    message: SuccessMessage.PERMISSIONS_FETCHED,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result.data,
                    attributes: (result) => result.attributes,
                },
            })
        },
        {
            query: "readAllPermissionModel",
        },
    )
