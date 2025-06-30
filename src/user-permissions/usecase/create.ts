import bearer from "@elysiajs/bearer"
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
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"
import { getUser } from "@/src/general/usecase/get-user"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { createUserPermissionModel } from "../data/user-permissions.model"

export const createUserPermission = new Elysia()
    .use(createUserPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .post(
        "/user-permission",
        async ({ body, bearer, set, jwtAccess }) => {
            const path = "user-permissions.create.usecase"
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

            // Verify if user has permission to create user permissions
            const { valid } = await verifyPermission(
                ManageUserPermission.CREATE_USER_PERMISSION,
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
