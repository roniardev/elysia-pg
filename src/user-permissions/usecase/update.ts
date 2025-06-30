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
import {
    readUserPermissionModel,
    updateUserPermissionModel,
} from "../data/user-permissions.model"

export const updateUserPermission = new Elysia()
    .use(updateUserPermissionModel)
    .use(readUserPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .patch(
        "/user-permission/:id",
        async ({ params, body, bearer, set, jwtAccess }) => {
            const path = "user-permissions.update.usecase"
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

            // Verify if user has permission to update user permissions
            const { valid } = await verifyPermission(
                ManageUserPermission.UPDATE_USER_PERMISSION,
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

            // UPDATE USER PERMISSION
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
                    createdAt: updatedUserPermission.createdAt.toISOString(),
                    updatedAt:
                        updatedUserPermission.updatedAt?.toISOString() ?? null,
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
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }
        },
        {
            params: "readUserPermissionModel",
            body: "updateUserPermissionModel",
        },
    )
