import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllPermissionModel } from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const readAllPermission = new Elysia()
    .use(readAllPermissionModel)
    .use(requirePermission(ManagePermission.READ_ALL_PERMISSION))
    .get(
        "/permissions",
        async ({ query, set }) => {
            const path = "permissions.read-all.usecase"

            const result = await Effect.runPromise(
                Effect.either(PermissionService.readAll(query)),
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
                message: SuccessMessage.PERMISSIONS_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right.data,
                attributes: result.right.attributes,
                path,
            })
        },
        {
            query: "readAllPermissionModel",
        },
    )
