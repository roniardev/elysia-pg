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

            // VERIFY IF USER HAS PERMISSION TO CREATE PERMISSIONS
            const { valid } = await verifyPermission(
                ManagePermission.CREATE_PERMISSION,
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
                return handleResponse(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                )
            }

            const response = {
                id: permissionId,
                name: body.name,
                description: body.description,
            }

            return handleResponse(
                SuccessMessage.PERMISSION_CREATED,
                () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                response,
            )
        },
        {
            body: "createPermissionModel",
        },
    )
