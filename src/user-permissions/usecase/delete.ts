import bearer from "@elysiajs/bearer"
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
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"
import { getUser } from "@/src/general/usecase/get-user"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { deleteUserPermissionModel } from "../data/user-permissions.model"
import { verrou } from "@/utils/services/locks"

export const deleteUserPermission = new Elysia()
    .use(deleteUserPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .delete(
        "/user-permission/:id",
        async ({ params, bearer, set, jwtAccess }) => {
            const path = "user-permissions.delete.usecase"
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

            // Verify if user has permission to delete user permissions
            const { valid } = await verifyPermission(
                ManageUserPermission.DELETE_USER_PERMISSION,
                existingUser.user?.id || validToken.id,
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
                .createLock(`${existingUser.user?.id}:delete-user-permission`)
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
