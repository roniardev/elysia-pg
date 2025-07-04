import bearer from "@elysiajs/bearer"
import { type SQL, and, asc, desc, eq, sql } from "drizzle-orm"
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
import { readAllUserPermissionModel } from "../data/user-permissions.model"

export const readAllUserPermission = new Elysia()
    .use(readAllUserPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .get(
        "/user-permission",
        async ({ query, bearer, set, jwtAccess }) => {
            const path = "user-permissions.read-all.usecase"
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

            // Verify if user has permission to read user permissions
            const { valid } = await verifyPermission(
                ManageUserPermission.READ_USER_PERMISSION,
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

            // READ ALL USER PERMISSIONS
            const { page = 1, limit = 10, includeRevoked = false } = query
            const offset = (page - 1) * limit

            let whereClause: SQL<unknown> = eq(
                userPermissions.userId,
                query.userId,
            )

            if (!includeRevoked) {
                whereClause = and(
                    whereClause,
                    eq(userPermissions.revoked, false),
                ) as SQL<unknown>
            }

            const [userPermissionsCount] = await db
                .select({ count: sql<number>`count(*)` })
                .from(userPermissions)
                .where(whereClause)

            const userPermissionsList = await db.query.userPermissions.findMany(
                {
                    where: () => whereClause,
                    with: {
                        permission: true,
                    },
                    limit,
                    offset,
                    orderBy: [desc(userPermissions.createdAt)],
                },
            )

            const totalPages = Math.ceil(
                (userPermissionsCount?.count || 0) / limit,
            )

            const response = {
                data: userPermissionsList.map((userPermission) => ({
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
                })),
                pagination: {
                    page,
                    limit,
                    totalItems: userPermissionsCount?.count || 0,
                    totalPages,
                },
            }

            return handleResponse({
                message: SuccessMessage.USER_PERMISSIONS_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: response.data,
                attributes: response.pagination,
                path,
            })
        },
        {
            query: "readAllUserPermissionModel",
        },
    )
