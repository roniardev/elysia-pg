import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deletePermissionModel } from "@/src/permissions/data/permissions.model"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"

export const deletePermission = new Elysia()
    .use(deletePermissionModel)
    .use(requirePermission(ManagePermission.DELETE_PERMISSION))
    .delete(
        "/permission/:id",
        async ({ params, set, store }) => {
            const path = "permissions.delete.usecase"
            const { userId } = store.auth

            // CHECK IF PERMISSION EXISTS
            const existingPermission = await db.query.permissions.findFirst({
                where: (table, { eq, and, isNull }) => {
                    return and(eq(table.id, params.id), isNull(table.deletedAt))
                },
            })

            if (!existingPermission) {
                return handleResponse({
                    message: ErrorMessage.PERMISSION_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            // DELETE PERMISSION
            await verrou
                .createLock(`${userId}:delete-permission`)
                .run(async () => {
                    try {
                        await db
                            .update(permissions)
                            .set({ deletedAt: new Date() })
                            .where(eq(permissions.id, params.id))
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
                message: SuccessMessage.PERMISSION_DELETED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            params: "deletePermissionModel",
        },
    )
