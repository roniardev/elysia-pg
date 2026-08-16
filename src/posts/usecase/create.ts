import { Effect } from "effect"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createPostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"
import { handleResponse } from "@/utils/handle-response"

export const createPost = new Elysia()
    .use(createPostModel)
    .use(requirePermission(PostPermission.CREATE_POST))
    .post(
        "/post",
        async ({ body, set, store }) => {
            const path = "posts.create.usecase"
            const { userId } = store.auth

            const result = await Effect.runPromise(
                Effect.either(PostService.create(body, userId)),
            )

            if (result._tag === "Left") {
                return handleResponse({
                    message: result.left.message,
                    callback: () => {
                        set.status = result.left.status
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.POST_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                data: result.right,
                path,
            })
        },
        {
            body: "createPostModel",
        },
    )
