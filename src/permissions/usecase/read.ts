import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPermissionModel } from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"

export const readPermission = new Elysia()
    .use(readPermissionModel)
    .use(requirePermission(ManagePermission.READ_PERMISSION))
    .get(
        "/permission/:id",
        async ({ params, set }) => {
            const path = "permissions.read.usecase"

            return runService(PermissionService.read(params.id), {
                set,
                path,
                success: {
                    message: SuccessMessage.PERMISSION_READ,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result,
                },
            })
        },
        {
            params: "readPermissionModel",
        },
    )
