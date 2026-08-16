import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deletePostModel } from "@/src/posts/data/posts.model"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"

export const deletePost = new Elysia()
    .use(deletePostModel)
    .use(requirePermission(PostPermission.DELETE_POST))
    .delete(
        "/post/:id",
        async ({ set, store, params }) => {
            const path = "posts.delete.usecase"
            const { userId } = store.auth

            // CHECK EXISTING POST
            const existingPost = await db.query.posts.findFirst({
                where: (table, { eq, and }) => {
                    return and(
                        eq(table.id, params.id),
                        eq(table.userId, userId),
                    )
                },
            })

            if (!existingPost) {
                return handleResponse({
                    message: ErrorMessage.POST_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }

            await verrou
                .createLock(`deletePost:${existingPost.id}`)
                .run(async () => {
                    // DELETE POST
                    try {
                        await db
                            .delete(posts)
                            .where(eq(posts.id, existingPost.id))
                    } catch (error) {
                        console.error(error)
                        return handleResponse({
                            message: ErrorMessage.INTERNAL_SERVER_ERROR,
                            callback: () => {
                                set.status =
                                    ResponseErrorStatus.INTERNAL_SERVER_ERROR
                            },
                            path,
                        })
                    }
                })

            return handleResponse({
                message: SuccessMessage.POST_DELETED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        // {
        //     params: "deletePostModel",
        // },
    )
