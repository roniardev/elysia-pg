import { Elysia } from "elysia"
import { ulid } from "ulid"

import { ManagePermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createPermissionModel } from "@/src/permissions/data/permissions.model"
import { handleResponse } from "@/utils/handle-response"

export const createPermission = new Elysia()
    .use(createPermissionModel)
    .use(requirePermission(ManagePermission.CREATE_PERMISSION))
    .post(
        "/permission",
        async ({ body, set }) => {
            const path = "permissions.create.usecase"

            // CREATE PERMISSION
            const permissionId = ulid()

            try {
                await db.insert(permissions).values({
                    id: permissionId,
                    name: body.name,
                    description: body.description,
                })
            } catch (error) {
                console.error(error)
                return handleResponse({
                    message: ErrorMessage.INTERNAL_SERVER_ERROR,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }

            const response = {
                id: permissionId,
                name: body.name,
                description: body.description,
            }

            return handleResponse({
                message: SuccessMessage.PERMISSION_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                data: response,
                path,
            })
        },
        {
            body: "createPermissionModel",
        },
    )
