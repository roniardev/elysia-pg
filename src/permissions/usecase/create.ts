import { Effect } from "effect"
import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createPermissionModel } from "@/src/permissions/data/permissions.model"
import { PermissionService } from "@/src/permissions/service"
import { handleResponse } from "@/utils/handle-response"

export const createPermission = new Elysia()
    .use(createPermissionModel)
    .use(requirePermission(ManagePermission.CREATE_PERMISSION))
    .post(
        "/permission",
        async ({ body, set }) => {
            const path = "permissions.create.usecase"

            const result = await Effect.runPromise(
                Effect.either(PermissionService.create(body)),
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
                message: SuccessMessage.PERMISSION_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                data: result.right,
                path,
            })
        },
        {
            body: "createPermissionModel",
        },
    )
