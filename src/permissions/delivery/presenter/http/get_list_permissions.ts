import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { getListPermissionModel } from "@/src/permissions/delivery/dto/permission_request"
import { PermissionUsecase } from "@/src/permissions/domain/usecase"

export const getListPermissions = new Elysia()
    .use(getListPermissionModel)
    .use(requirePermission(ManagePermission.READ_ALL_PERMISSION))
    .get(
        "/permissions",
        async ({ query, set }) => {
            const path = "permissions.read-all.usecase"

            return runService(PermissionUsecase.getList(query), {
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
            query: "getListPermissionModel",
        },
    )
