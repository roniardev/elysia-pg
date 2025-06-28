import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { readUserPermissionModel } from "../data/user-permissions.model"

export const readUserPermission = new Elysia()
    .use(readUserPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .get(
        "/user-permission/:id",
        async ({ params, bearer, set, jwtAccess }) => {
            const validToken = await jwtAccess.verify(bearer)
            if (!validToken) {
                return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
                    set.status = ResponseErrorStatus.FORBIDDEN
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
                return handleResponse(ErrorMessage.INVALID_USER, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
                })
            }

            // Verify if user has permission to read user permissions
            const { valid } = await verifyPermission(
                ManageUserPermission.READ_USER_PERMISSION,
                existingUser.id,
            )

            if (!valid) {
                return handleResponse(
                    ErrorMessage.UNAUTHORIZED_PERMISSION,
                    () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                )
            }

            // READ USER PERMISSION
            const userPermission = await db.query.userPermissions.findFirst({
                where: (fields, { eq }) => eq(fields.id, params.id),
                with: {
                    permission: true,
                },
            })

            if (!userPermission) {
                return handleResponse(
                    ErrorMessage.USER_PERMISSION_NOT_FOUND,
                    () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                )
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

            return handleResponse(
                SuccessMessage.USER_PERMISSION_READ,
                () => {
                    set.status = ResponseSuccessStatus.OK
                },
                response,
            )
        },
        {
            params: "readUserPermissionModel",
        },
    )
