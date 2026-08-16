import { eq } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { Scope } from "@/common/enum/scopes"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { verrou } from "@/utils/services/locks"

export type UpdatePostInput = {
    title?: string
    excerpt?: string
    content?: string
    status?: "draft" | "published"
    visibility?: "public" | "private"
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
                return new ServiceError(
                    ErrorMessage.FAILED_TO_UPDATE_POST,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingPost) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.POST_NOT_FOUND,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        const result = yield* Effect.tryPromise({
            try: () =>
                verrou.createLock(`${userId}:update-post`).run(async () => {
                    await db
                        .update(posts)
                        .set({
                            title: input.title || existingPost.title,
                            excerpt: input.excerpt || existingPost.excerpt,
                            content: input.content || existingPost.content,
                            status: input.status || existingPost.status,
                            visibility:
                                input.visibility || existingPost.visibility,
                            tags: input.tags || existingPost.tags,
                            updatedAt: new Date(),
                        })
                        .where(eq(posts.id, existingPost.id))

                    const updatedPost = await db.query.posts.findFirst({
                        where: (table, { eq: eqField }) =>
                            eqField(table.id, existingPost.id),
                    })

                    if (!updatedPost) {
                        return null
                    }

                    return {
                        id: updatedPost.id,
                        title: updatedPost.title,
                        excerpt: updatedPost.excerpt,
                        content: updatedPost.content,
                        status: updatedPost.status,
                        visibility: updatedPost.visibility,
                        tags: updatedPost.tags,
                        createdAt: updatedPost.createdAt.toISOString(),
                        updatedAt: updatedPost.updatedAt?.toISOString() ?? null,
                    }
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.FAILED_TO_UPDATE_POST,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const didAcquire = result[0]
        const updatedPost = result[1]

        if (!didAcquire || !updatedPost) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.POST_NOT_FOUND,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        return updatedPost
    })
