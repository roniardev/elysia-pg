import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { scopeWhere } from "@/src/general/scope-where"
import { ServiceError } from "@/src/general/service-error"

export const readPost = (id: string, userId: string, scope: string | null) =>
    Effect.gen(function* () {
        const post = yield* Effect.tryPromise({
            try: () =>
                db.query.posts.findFirst({
                    where: scopeWhere(posts, id, userId, scope),
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.FAILED_TO_READ_POST,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!post) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.POST_NOT_FOUND,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        return post
    })
