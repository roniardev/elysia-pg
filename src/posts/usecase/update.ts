import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { Scope } from "@/common/enum/scopes"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPostModel, updatePostModel } from "@/src/posts/data/posts.model"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"

export const updatePost = new Elysia()
    .use(updatePostModel)
    .use(readPostModel)
    .use(requirePermission(PostPermission.UPDATE_POST, { scope: true }))
    .put(
        "/post/:id",
        async ({ body, params, set, store }) => {
            const path = "posts.update.usecase"
            const { userId, scope } = store.auth

            // CHECK EXISTING POST
            const existingPost = await db.query.posts.findFirst({
                where: (table, { eq, and }) => {
                    if (scope === Scope.PERSONAL) {
                        return and(
                            eq(table.id, params.id),
                            eq(table.userId, userId),
                        )
                    }
                    return eq(table.id, params.id)
                },
            })

            if (!existingPost) {
                return handleResponse({
                    message: ErrorMessage.POST_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            await verrou
                .createLock(`updatePost:${existingPost.id}`)
                .run(async () => {
                    // UPDATE POST
                    try {
                        await db
                            .update(posts)
                            .set({
                                title: body.title || existingPost.title,
                                excerpt: body.excerpt || existingPost.excerpt,
                                content: body.content || existingPost.content,
                                status:
                                    (body.status as "draft" | "published") ||
                                    (existingPost.status as
                                        | "draft"
                                        | "published"),
                                visibility:
                                    (body.visibility as "public" | "private") ||
                                    (existingPost.visibility as
                                        | "public"
                                        | "private"),
                                tags: body.tags || existingPost.tags,
                                updatedAt: new Date(),
                            })
                            .where(eq(posts.id, existingPost.id))
                    } catch (error) {
                        console.error(error)
                        return handleResponse({
                            message: ErrorMessage.FAILED_TO_UPDATE_POST,
                            callback: () => {
                                set.status =
                                    ResponseErrorStatus.INTERNAL_SERVER_ERROR
                            },
                            path,
                        })
                    }
                })

            return handleResponse({
                message: SuccessMessage.POST_UPDATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            body: "updatePostModel",
        },
    )
