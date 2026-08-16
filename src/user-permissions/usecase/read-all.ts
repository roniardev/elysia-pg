import { and, desc, eq, type SQL } from "drizzle-orm"
import { Elysia } from "elysia"

import { ManageUserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { userPermissions } from "@/db/schema/user-permissions"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllUserPermissionModel } from "@/src/user-permissions/data/user-permissions.model"
import { handleResponse } from "@/utils/handle-response"
import { getPagination } from "@/utils/pagination"

export const readAllUserPermission = new Elysia()
    .use(readAllUserPermissionModel)
    .use(requirePermission(ManageUserPermission.READ_USER_PERMISSION))
    .get(
        "/user-permission",
        async ({ query, set }) => {
            const path = "user-permissions.read-all.usecase"
            const { page = 1, limit = 10, includeRevoked = false } = query

            // WHERE BUILDER: shared by list and total-count queries
            const buildWhereClause = (
                userId: string,
                includeRevoked: boolean,
            ): SQL<unknown> => {
                const conditions = [eq(userPermissions.userId, userId)]
                if (!includeRevoked) {
                    conditions.push(eq(userPermissions.revoked, false))
                }
                return and(...conditions) as SQL<unknown>
            }

            const whereClause = buildWhereClause(query.userId, includeRevoked)

            const userPermissionsList = await db.query.userPermissions.findMany(
                {
                    where: () => whereClause,
                    with: {
                        permission: true,
                    },
                    limit: Number(limit),
                    offset: (Number(page) - 1) * Number(limit),
                    orderBy: [desc(userPermissions.createdAt)],
                },
            )

            const total = await db.$count(userPermissions, whereClause)

            const { attributes } = getPagination(
                Number(page),
                Number(limit),
                total,
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
            }

            return handleResponse({
                message: SuccessMessage.USER_PERMISSIONS_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: response.data,
                attributes,
                path,
            })
        },
        {
            query: "readAllUserPermissionModel",
        },
    )
