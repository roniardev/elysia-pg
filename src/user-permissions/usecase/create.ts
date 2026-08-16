import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { UserPermissionService } from "@/src/user-permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const createUserPermission = new Elysia()
    .use(createUserPermissionModel)
    .use(requirePermission(ManageUserPermission.CREATE_USER_PERMISSION))
    .post(
        "/user-permission",
        async ({ body, set }) => {
            const path = "user-permissions.create.usecase"

            const result = await Effect.runPromise(
                Effect.either(UserPermissionService.create(body)),
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
                message: SuccessMessage.USER_PERMISSION_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                data: result.right,
                path,
            })
        },
        {
            body: "createUserPermissionModel",
        },
    )
