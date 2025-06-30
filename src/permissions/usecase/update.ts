import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"
import { getUser } from "@/src/general/usecase/get-user"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { eq } from "drizzle-orm"
import {
    readPermissionModel,
    updatePermissionModel,
} from "../data/permissions.model"
import { verrou } from "@/utils/services/locks"

export const updatePermission = new Elysia()
    .use(updatePermissionModel)
    .use(readPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .put(
        "/permission/:id",
        async ({ params, body, bearer, set, jwtAccess }) => {
            const path = "permissions.update.usecase"
            const validToken = await jwtAccess.verify(bearer)
            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: validToken.id,
                type: "id",
                condition: {
                    deleted: false,
                },
            })

            if (!existingUser.user) {
                return handleResponse({
                    message: ErrorMessage.INVALID_USER,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // VERIFY IF USER HAS PERMISSION TO UPDATE PERMISSIONS
            const { valid } = await verifyPermission(
                ManagePermission.UPDATE_PERMISSION,
                existingUser.user.id,
            )

            if (!valid) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED_PERMISSION,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

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
                .createLock(`${existingUser.user?.id}:update-permission`)
                .run(async () => {
                    try {
                        await db
                            .update(permissions)
                            .set({
                                name: body.name || existingPermission.name,
                                description:
                                    body.description !== undefined
                                        ? body.description
                                        : existingPermission.description,
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
