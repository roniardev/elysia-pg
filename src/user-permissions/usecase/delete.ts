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
import { deleteUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"

export const deleteUserPermission = new Elysia()
    .use(deleteUserPermissionModel)
    .use(requirePermission(ManageUserPermission.DELETE_USER_PERMISSION))
    .delete(
        "/user-permission/:id",
        async ({ params, set, store }) => {
            const path = "user-permissions.delete.usecase"
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

            // DELETE USER PERMISSION
            await verrou
                .createLock(`${userId}:delete-user-permission`)
                .run(async () => {
                    try {
                        await db
                            .delete(userPermissions)
                            .where(eq(userPermissions.id, params.id))
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

            return handleResponse({
                message: SuccessMessage.USER_PERMISSION_DELETED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            params: "deleteUserPermissionModel",
        },
    )
