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
import { readPermissionModel } from "../data/permissions.model"
import { getUser } from "@/src/general/usecase/get-user"

export const readPermission = new Elysia()
    .use(readPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .get(
        "/permission/:id",
        async ({ params, bearer, set, jwtAccess }) => {
            const path = "permissions.read.usecase"
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

            // VERIFY IF USER HAS PERMISSION TO READ PERMISSIONS
            const { valid } = await verifyPermission(
                ManagePermission.READ_PERMISSION,
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

            // READ PERMISSIONS
            try {
                const permission = await db.query.permissions.findFirst({
                    where: (table, { eq }) => eq(table.id, params.id),
                })

                if (!permission) {
                    return handleResponse({
                        message: ErrorMessage.PERMISSION_NOT_FOUND,
                        callback: () => {
                            set.status = ResponseErrorStatus.NOT_FOUND
                        },
                        path,
                    })
                }

                const responseData = [
                    {
                        id: permission.id,
                        name: permission.name,
                        description: permission.description,
                        createdAt: permission.createdAt.toISOString(),
                        updatedAt: permission.updatedAt?.toISOString() || null,
                    },
                ]

                return handleResponse({
                    message: SuccessMessage.PERMISSION_READ,
                    callback: () => {
                        set.status = ResponseSuccessStatus.OK
                    },
                    data: responseData,
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
            params: "readPermissionModel",
        },
    )
