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
import {
    readPermissionModel,
    updatePermissionModel,
} from "@/src/permissions/data/permissions.model"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"

export const updatePermission = new Elysia()
    .use(updatePermissionModel)
    .use(readPermissionModel)
    .use(requirePermission(ManagePermission.UPDATE_PERMISSION))
    .put(
        "/permission/:id",
        async ({ params, body, set, store }) => {
            const path = "permissions.update.usecase"
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

            // UPDATE PERMISSION
            await verrou
                .createLock(`${userId}:update-permission`)
                .run(async () => {
                    try {
                        await db
                            .update(permissions)
                            .set({
                                name: body.name || existingPermission.name,
                                description:
                                    body.description ??
                                    existingPermission.description,
                                updatedAt: new Date(),
                            })
                            .where(eq(permissions.id, params.id))

                        const updatedPermission =
                            await db.query.permissions.findFirst({
                                where: (table, { eq }) =>
                                    eq(table.id, params.id),
                            })

                        if (!updatedPermission) {
                            return handleResponse({
                                message: ErrorMessage.PERMISSION_NOT_FOUND,
                                callback: () => {
                                    set.status = ResponseErrorStatus.NOT_FOUND
                                },
                                path,
                            })
                        }

                        const response = {
                            id: updatedPermission.id,
                            name: updatedPermission.name,
                            description: updatedPermission.description,
                            createdAt:
                                updatedPermission.createdAt.toISOString(),
                            updatedAt:
                                updatedPermission.updatedAt?.toISOString() ||
                                null,
                        }

                        return handleResponse({
                            message: SuccessMessage.PERMISSION_UPDATED,
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
            params: "readPermissionModel",
            body: "updatePermissionModel",
        },
    )
