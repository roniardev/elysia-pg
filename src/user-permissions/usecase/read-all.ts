import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const readAllUserPermission = new Elysia()
    .use(readAllUserPermissionModel)
    .use(requirePermission(ManageUserPermission.READ_USER_PERMISSION))
    .get(
        "/user-permission",
        async ({ query, set }) => {
            const path = "user-permissions.read-all.usecase"

            const result = await Effect.runPromise(
                Effect.either(UserPermissionService.readAll(query)),
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
                message: SuccessMessage.USER_PERMISSIONS_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right.data,
                attributes: result.right.attributes,
                path,
            })
        },
        {
            query: "readAllUserPermissionModel",
        },
    )
