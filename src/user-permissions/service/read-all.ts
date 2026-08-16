import { and, desc, eq, type SQL } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { userPermissions } from "@/db/schema/user-permissions"
import { ServiceError } from "@/src/general/service-error"
import { getPagination } from "@/utils/pagination"

export type ReadAllUserPermissionInput = {
    userId: string
    page: number
    limit: number
    includeRevoked?: boolean
}

export const readAllUserPermission = (input: ReadAllUserPermissionInput) =>
    Effect.gen(function* () {
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

        const whereClause = buildWhereClause(
            input.userId,
            input.includeRevoked ?? false,
        )

        const list = yield* Effect.tryPromise({
            try: () =>
                db.query.userPermissions.findMany({
                    where: () => whereClause,
                    with: {
                        permission: true,
                    },
                    limit: Number(input.limit),
                    offset: (Number(input.page) - 1) * Number(input.limit),
                    orderBy: [desc(userPermissions.createdAt)],
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const total = yield* Effect.tryPromise({
            try: () => db.$count(userPermissions, whereClause),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const { totalPage, attributes } = getPagination(
            Number(input.page),
            Number(input.limit),
            total,
        )

        if (input.page > totalPage && totalPage > 0) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.PAGE_NOT_FOUND,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        return {
            data: list.map((userPermission) => ({
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
            attributes,
        }
    })
