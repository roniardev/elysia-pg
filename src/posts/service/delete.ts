import { and, eq } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { posts } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { PostsDatabaseService } from "@/src/posts/service/posts-database"
import { verrou } from "@/utils/services/locks"

export const deletePost = (id: string, userId: string) =>
    Effect.gen(function* () {
        const database = yield* PostsDatabaseService
        const existingPost = yield* Effect.tryPromise({
            try: () =>
                database.query.posts.findFirst({
                    where: (table, { eq, and }) =>
                        and(eq(table.id, id), eq(table.userId, userId)),
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingPost) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.POST_NOT_FOUND,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                ),
            )
        }

        yield* Effect.tryPromise({
            try: () =>
                verrou.createLock(`${userId}:delete-post`).run(async () => {
                    await database
                        .delete(posts)
                        .where(eq(posts.id, existingPost.id))
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return existingPost
    })
