import { Elysia } from "elysia"
import { ulid } from "ulid"

import { PostPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createPostModel } from "@/src/posts/data/posts.model"
import { handleResponse } from "@/utils/handle-response"

export const createPost = new Elysia()
    .use(createPostModel)
    .use(requirePermission(PostPermission.CREATE_POST))
    .post(
        "/post",
        async ({ body, set, store }) => {
            const path = "posts.create.usecase"
            const { userId } = store.auth

            // CREATE POST
            const postId = ulid()

            try {
                await db.insert(posts).values({
                    id: postId,
                    userId,
                    title: body.title,
                    excerpt: body.excerpt,
                    content: body.content,
                })
            } catch (error) {
                console.error(error)
                return handleResponse({
                    message: ErrorMessage.INTERNAL_SERVER_ERROR,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }

            const response = {
                id: postId,
                title: body.title,
                excerpt: body.excerpt,
                content: body.content,
            }

            return handleResponse({
                message: SuccessMessage.POST_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                data: response,
                path,
            })
        },
        {
            body: "createPostModel",
        },
    )
