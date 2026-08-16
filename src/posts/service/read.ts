import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { Scope } from "@/common/enum/scopes"
import { db } from "@/db"
import { PostServiceError } from "@/src/posts/service/error"

export const readPost = (id: string, userId: string, scope: string | null) =>
    Effect.gen(function* () {
        const post = yield* Effect.tryPromise({
            try: () =>
                db.query.posts.findFirst({
                    where: (table, { eq, and }) => {
                        if (scope === Scope.PERSONAL) {
                            return and(
                                eq(table.id, id),
                                eq(table.userId, userId),
                            )
                        }

                        return eq(table.id, id)
                    },
                }),
            catch: (error) => {
                console.error(error)
                return new PostServiceError(
                    ErrorMessage.FAILED_TO_READ_POST,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!post) {
            return yield* Effect.fail(
                new PostServiceError(
                    ErrorMessage.POST_NOT_FOUND,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        return post
    })
