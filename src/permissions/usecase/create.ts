import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { ulid } from "ulid"

import { ManagePermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"
import { getUser } from "@/src/general/usecase/get-user"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { createPermissionModel } from "../data/permissions.model"

export const createPermission = new Elysia()
    .use(createPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .post(
        "/permission",
        async ({ body, bearer, set, jwtAccess }) => {
            const path = "permissions.create.usecase"
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

            // VERIFY IF USER HAS PERMISSION TO CREATE PERMISSIONS
            const { valid } = await verifyPermission(
                ManagePermission.CREATE_PERMISSION,
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

            // CREATE PERMISSION
            const permissionId = ulid()

            try {
                await db.insert(permissions).values({
                    id: permissionId,
                    name: body.name,
                    description: body.description,
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
                id: permissionId,
                name: body.name,
                description: body.description,
            }

            return handleResponse({
                message: SuccessMessage.PERMISSION_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                data: response,
                path,
            })
        },
        {
            body: "createPermissionModel",
        },
    )
