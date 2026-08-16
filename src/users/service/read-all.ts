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
        const total = yield* Effect.tryPromise({
            try: () => db.$count(users),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const data = yield* Effect.tryPromise({
            try: () =>
                db.query.users.findMany({
                    limit: Number(input.limit),
                    offset: (Number(input.page) - 1) * Number(input.limit),
                    with: {
                        permissions: true,
                    },
                }),
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

        if (input.page > totalPage) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.PAGE_NOT_FOUND,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        return { data, attributes }
    })
