import { and, asc, desc, isNull, like, type SQL } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import Sorting from "@/common/enum/sorting"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"
import { ServiceError } from "@/src/general/service-error"
import { getPagination } from "@/utils/pagination"

export type ReadAllPermissionInput = {
    page: number
    limit: number
    sort?: string
    search?: string
}

export const readAllPermission = (input: ReadAllPermissionInput) =>
    Effect.gen(function* () {
        // WHERE BUILDER: shared by list and total-count queries
        const buildPermissionWhere = (
            search: string | undefined,
        ): SQL | undefined => {
            const conditions = [isNull(permissions.deletedAt)]
            if (search) {
                conditions.push(like(permissions.name, `%${search}%`))
            }
            return and(...conditions)
        }

        let orderBy = desc(permissions.createdAt)
        if (input.sort === Sorting.ASC) {
            orderBy = asc(permissions.createdAt)
        }

        const data = yield* Effect.tryPromise({
            try: () =>
                db
                    .select()
                    .from(permissions)
                    .where(buildPermissionWhere(input.search))
                    .orderBy(orderBy)
                    .limit(Number(input.limit))
                    .offset((Number(input.page) - 1) * Number(input.limit)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (data.length === 0) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.PERMISSION_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        const total = yield* Effect.tryPromise({
            try: () =>
                db.$count(permissions, buildPermissionWhere(input.search)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const { attributes } = getPagination(
            Number(input.page),
            Number(input.limit),
            total,
        )

        return { data, attributes }
    })
