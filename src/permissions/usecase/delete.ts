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

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { eq } from "drizzle-orm"
import { deletePermissionModel } from "../data/permissions.model"

export const deletePermission = new Elysia()
    .use(deletePermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .delete(
        "/permission/:id",
        async ({ params, bearer, set, jwtAccess }) => {
            const path = "permissions.delete.usecase"
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
            const existingUser = await db.query.users.findFirst({
                where: (table, { eq, and, isNull }) => {
                    return and(
                        eq(table.id, validToken.id),
                        isNull(table.deletedAt),
                    )
                },
            })

            if (!existingUser) {
                return handleResponse({
                    message: ErrorMessage.INVALID_USER,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // VERIFY IF USER HAS PERMISSION TO DELETE PERMISSIONS
            const { valid } = await verifyPermission(
                ManagePermission.DELETE_PERMISSION,
                existingUser.id,
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

            // SOFT DELETE PERMISSION
            try {
                await db
                    .update(permissions)
                    .set({
                        deletedAt: new Date(),
                    })
                    .where(eq(permissions.id, params.id))

                return handleResponse({
                    message: SuccessMessage.PERMISSION_DELETED,
                    callback: () => {
                        set.status = ResponseSuccessStatus.OK
                    },
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
            params: "deletePermissionModel",
        },
    )
