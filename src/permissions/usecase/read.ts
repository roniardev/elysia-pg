import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPermissionModel } from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const readPermission = new Elysia()
    .use(readPermissionModel)
    .use(requirePermission(ManagePermission.READ_PERMISSION))
    .get(
        "/permission/:id",
        async ({ params, set }) => {
            const path = "permissions.read.usecase"

            const result = await Effect.runPromise(
                Effect.either(PermissionService.read(params.id)),
            )

            if (result._tag === "Left") {
                return handleResponse({
                    message: result.left.message,
                    callback: () => {
                        set.status = result.left.status
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.PERMISSION_READ,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right,
                path,
            })
        },
        {
            params: "readPermissionModel",
        },
    )
