import { and, isNull } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { users } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { getPagination } from "@/utils/pagination"

export type ReadAllUserInput = {
    page: number
    limit: number
}

export const readAllUser = (input: ReadAllUserInput) =>
    Effect.gen(function* () {
        const notDeleted = and(isNull(users.deletedAt))

        if (input.page === 0) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.PAGE_INVALID,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        const total = yield* Effect.tryPromise({
            try: () => db.$count(users, notDeleted),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const data = yield* Effect.tryPromise({
            try: () => {
                if (input.page === -1) {
                    return db.query.users.findMany({
                        where: notDeleted,
                        with: {
                            permissions: true,
                        },
                    })
                }
                return db.query.users.findMany({
                    where: notDeleted,
                    limit: Number(input.limit),
                    offset: (Number(input.page) - 1) * Number(input.limit),
                    with: {
                        permissions: true,
                    },
                })
            },
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
            data: data.map((user) => ({
                id: user.id,
                email: user.email,
                emailVerified: user.emailVerified,
                photo: user.photo,
                permissions: user.permissions,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt?.toISOString() ?? null,
            })),
            attributes,
        }
    })
