import { eq } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { Scope } from "@/common/enum/scopes"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { PostServiceError } from "@/src/posts/service/error"
import { verrou } from "@/utils/services/locks"

export type UpdatePostInput = {
    title?: string
    excerpt?: string
    content?: string
    status?: string
    visibility?: string
    tags?: string
}

export const updatePost = (
    id: string,
    input: UpdatePostInput,
    userId: string,
    scope: string | null,
) =>
    Effect.gen(function* () {
        const existingPost = yield* Effect.tryPromise({
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
                    ErrorMessage.FAILED_TO_UPDATE_POST,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingPost) {
            return yield* Effect.fail(
                new PostServiceError(
                    ErrorMessage.POST_NOT_FOUND,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`updatePost:${existingPost.id}`)
                    .run(async () => {
                        await db
                            .update(posts)
                            .set({
                                title: input.title || existingPost.title,
                                excerpt: input.excerpt || existingPost.excerpt,
                                content: input.content || existingPost.content,
                                status:
                                    (input.status as "draft" | "published") ||
                                    (existingPost.status as
                                        | "draft"
                                        | "published"),
                                visibility:
                                    (input.visibility as
                                        | "public"
                                        | "private") ||
                                    (existingPost.visibility as
                                        | "public"
                                        | "private"),
                                tags: input.tags || existingPost.tags,
                                updatedAt: new Date(),
                            })
                            .where(eq(posts.id, existingPost.id))
                    }),
            catch: (error) => {
                console.error(error)
                return new PostServiceError(
                    ErrorMessage.FAILED_TO_UPDATE_POST,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return existingPost
    })
