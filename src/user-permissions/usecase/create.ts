import { Elysia } from "elysia"
import { ulid } from "ulid"

import { ManageUserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { userPermissions } from "@/db/schema/user-permissions"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { handleResponse } from "@/utils/handle-response"

export const createUserPermission = new Elysia()
    .use(createUserPermissionModel)
    .use(requirePermission(ManageUserPermission.CREATE_USER_PERMISSION))
    .post(
        "/user-permission",
        async ({ body, set }) => {
            const path = "user-permissions.create.usecase"

            // Check if permission already exists and not revoked
            const existingPermission = await db.query.userPermissions.findFirst(
                {
                    where: (fields, { eq, and }) =>
                        and(
                            eq(fields.userId, body.userId),
                            eq(fields.permissionId, body.permissionId),
                            eq(fields.revoked, false),
                        ),
                },
            )

            if (existingPermission) {
                return handleResponse({
                    message: ErrorMessage.PERMISSION_ALREADY_ASSIGNED,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // CREATE USER PERMISSION
            const userPermissionId = ulid()

            try {
                await db.insert(userPermissions).values({
                    id: userPermissionId,
                    userId: body.userId,
                    permissionId: body.permissionId,
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
                id: userPermissionId,
                userId: body.userId,
                permissionId: body.permissionId,
                revoked: false,
            }

            return handleResponse({
                message: SuccessMessage.USER_PERMISSION_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                data: response,
                path,
            })
        },
        {
            body: "createUserPermissionModel",
        },
    )
