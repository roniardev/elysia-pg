import { and, eq } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { PostServiceError } from "@/src/posts/service/error"
import { verrou } from "@/utils/services/locks"

export const deletePost = (id: string, userId: string) =>
    Effect.gen(function* () {
        const existingPost = yield* Effect.tryPromise({
            try: () =>
                db.query.posts.findFirst({
                    where: (table, { eq, and }) =>
                        and(eq(table.id, id), eq(table.userId, userId)),
                }),
            catch: (error) => {
                console.error(error)
                return new PostServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingPost) {
            return yield* Effect.fail(
                new PostServiceError(
                    ErrorMessage.POST_NOT_FOUND,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                ),
            )
        }

        yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`deletePost:${existingPost.id}`)
                    .run(async () => {
                        await db
                            .delete(posts)
                            .where(eq(posts.id, existingPost.id))
                    }),
            catch: (error) => {
                console.error(error)
                return new PostServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return existingPost
    })
