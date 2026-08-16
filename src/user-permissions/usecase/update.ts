import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { userPermissions } from "@/db/schema/user-permissions"
import { requirePermission } from "@/src/general/setup/require-permission"
import {
    readUserPermissionModel,
    updateUserPermissionModel,
} from "@/src/user-permissions/data/user-permissions.model"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"

export const updateUserPermission = new Elysia()
    .use(updateUserPermissionModel)
    .use(readUserPermissionModel)
    .use(requirePermission(ManageUserPermission.UPDATE_USER_PERMISSION))
    .patch(
        "/user-permission/:id",
        async ({ params, body, set, store }) => {
            const path = "user-permissions.update.usecase"
            const { userId } = store.auth

            // Check if user permission exists
            const existingUserPermission =
                await db.query.userPermissions.findFirst({
                    where: (fields, { eq }) => eq(fields.id, params.id),
                })

            if (!existingUserPermission) {
                return handleResponse({
                    message: ErrorMessage.USER_PERMISSION_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            // UPDATE USER PERMISSION
            await verrou
                .createLock(`${userId}:update-user-permission`)
                .run(async () => {
                    try {
                        const [updatedUserPermission] = await db
                            .update(userPermissions)
                            .set({
                                revoked: body.revoked,
                                updatedAt: new Date(),
                            })
                            .where(eq(userPermissions.id, params.id))
                            .returning()

                        if (!updatedUserPermission) {
                            return handleResponse({
                                message: ErrorMessage.USER_PERMISSION_NOT_FOUND,
                                callback: () => {
                                    set.status = ResponseErrorStatus.NOT_FOUND
                                },
                                path,
                            })
                        }

                        const response = {
                            id: updatedUserPermission.id,
                            userId: updatedUserPermission.userId,
                            permissionId: updatedUserPermission.permissionId,
                            revoked: updatedUserPermission.revoked,
                            createdAt:
                                updatedUserPermission.createdAt.toISOString(),
                            updatedAt:
                                updatedUserPermission.updatedAt?.toISOString() ??
                                null,
                        }

                        return handleResponse({
                            message: SuccessMessage.USER_PERMISSION_UPDATED,
                            callback: () => {
                                set.status = ResponseSuccessStatus.OK
                            },
                            data: response,
                            path,
                        })
                    } catch (error) {
                        console.error(error)
                        return handleResponse({
                            message: ErrorMessage.INTERNAL_SERVER_ERROR,
                            callback: () => {
                                set.status =
                                    ResponseErrorStatus.INTERNAL_SERVER_ERROR
                            },
                            path,
                        })
                    }
                })
        },
        {
            params: "readUserPermissionModel",
            body: "updateUserPermissionModel",
        },
    )
