import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPermissionModel } from "@/src/permissions/data/permissions.model"
import { handleResponse } from "@/utils/handle-response"

export const readPermission = new Elysia()
    .use(readPermissionModel)
    .use(requirePermission(ManagePermission.READ_PERMISSION))
    .get(
        "/permission/:id",
        async ({ params, set }) => {
            const path = "permissions.read.usecase"

            // READ PERMISSIONS
            try {
                const permission = await db.query.permissions.findFirst({
                    where: (table, { eq }) => eq(table.id, params.id),
                })

                if (!permission) {
                    return handleResponse({
                        message: ErrorMessage.PERMISSION_NOT_FOUND,
                        callback: () => {
                            set.status = ResponseErrorStatus.NOT_FOUND
                        },
                        path,
                    })
                }

                const responseData = [
                    {
                        id: permission.id,
                        name: permission.name,
                        description: permission.description,
                        createdAt: permission.createdAt.toISOString(),
                        updatedAt: permission.updatedAt?.toISOString() || null,
                    },
                ]

                return handleResponse({
                    message: SuccessMessage.PERMISSION_READ,
                    callback: () => {
                        set.status = ResponseSuccessStatus.OK
                    },
                    data: responseData,
                    path,
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
        },
        {
            params: "readPermissionModel",
        },
    )
