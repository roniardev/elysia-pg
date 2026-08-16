import { and, asc, desc, eq, like, type SQL } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { Scope } from "@/common/enum/scopes"
import Sorting from "@/common/enum/sorting"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { getPagination } from "@/utils/pagination"

export type ReadAllPostInput = {
    page: number
    limit: number
    sort?: string
    search?: string
}

export const readAllPost = (
    input: ReadAllPostInput,
    userId: string,
    scope: string | null,
) =>
    Effect.gen(function* () {
        const buildPostWhere = (
            search: string | undefined,
        ): SQL | undefined => {
            const conditions = []
            if (scope === Scope.PERSONAL) {
                conditions.push(eq(posts.userId, userId))
            }
            if (search) {
                conditions.push(like(posts.title, `%${search}%`))
            }
            return and(...conditions)
        }

        let orderBy = desc(posts.createdAt)
        if (input.sort === Sorting.ASC) {
            orderBy = asc(posts.createdAt)
        }

        const data = yield* Effect.tryPromise({
            try: () =>
                db.query.posts.findMany({
                    where: buildPostWhere(input.search),
                    limit: input.limit,
                    offset: (input.page - 1) * input.limit,
                    orderBy,
                    with: {
                        user: {
                            columns: {
                                id: true,
                            },
                        },
                    },
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.FAILED_TO_READ_POST,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const total = yield* Effect.tryPromise({
            try: () => db.$count(posts, buildPostWhere(input.search)),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.FAILED_TO_READ_POST,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const { totalPage, attributes } = getPagination(
            input.page,
            input.limit,
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
