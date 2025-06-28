import bearer from "@elysiajs/bearer"
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
import { getUser } from "@/src/general/usecase/get-user"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { createPostModel } from "../data/posts.model"

export const createPost = new Elysia()
    .use(createPostModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .post(
        "/post",
        async ({ body, bearer, set, jwtAccess }) => {
            const path = "posts.create.usecase"
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: validToken.id,
                type: "id",
                condition: {
                    deleted: false,
                },
            })

            if (!existingUser.user) {
                return handleResponse({
                    message: ErrorMessage.INVALID_USER,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            const { valid } = await verifyPermission(
                PostPermission.CREATE_POST,
                existingUser.user?.id,
            )

            if (!valid) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED_PERMISSION,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // CREATE POST
            const postId = ulid()

            try {
                await db.insert(posts).values({
                    id: postId,
                    userId: existingUser.user?.id,
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
