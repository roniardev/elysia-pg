import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createPermissionModel } from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"

export const createPermission = new Elysia()
    .use(createPermissionModel)
    .use(requirePermission(ManagePermission.CREATE_PERMISSION))
    .post(
        "/permission",
        async ({ body, set }) => {
            const path = "permissions.create.usecase"

            return runService(PermissionService.create(body), {
                set,
                path,
                success: {
                    message: SuccessMessage.PERMISSION_CREATED,
                    status: ResponseSuccessStatus.CREATED,
                    data: (result) => result,
                },
            })
        },
        {
            body: "createPermissionModel",
        },
    )
