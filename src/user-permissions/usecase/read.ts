import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { handleResponse } from "@/utils/handle-response"

export const readUserPermission = new Elysia()
    .use(readUserPermissionModel)
    .use(requirePermission(ManageUserPermission.READ_USER_PERMISSION))
    .get(
        "/user-permission/:id",
        async ({ params, set }) => {
            const path = "user-permissions.read.usecase"

            // READ USER PERMISSION
            const userPermission = await db.query.userPermissions.findFirst({
                where: (fields, { eq }) => eq(fields.id, params.id),
                with: {
                    permission: true,
                },
            })

            if (!userPermission) {
                return handleResponse({
                    message: ErrorMessage.USER_PERMISSION_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            const response = {
                id: userPermission.id,
                userId: userPermission.userId,
                permissionId: userPermission.permissionId,
                revoked: userPermission.revoked,
                createdAt: userPermission.createdAt.toISOString(),
                updatedAt: userPermission.updatedAt?.toISOString() ?? null,
                permission: {
                    id: userPermission.permission.id,
                    name: userPermission.permission.name,
                    description: userPermission.permission.description,
                },
            }

            return handleResponse({
                message: SuccessMessage.USER_PERMISSION_READ,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: response,
                path,
            })
        },
        {
            params: "readUserPermissionModel",
        },
    )
