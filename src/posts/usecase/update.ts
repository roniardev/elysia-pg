import { Effect } from "effect"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPostModel, updatePostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"
import { handleResponse } from "@/utils/handle-response"

export const updatePost = new Elysia()
    .use(updatePostModel)
    .use(readPostModel)
    .use(requirePermission(PostPermission.UPDATE_POST, { scope: true }))
    .put(
        "/post/:id",
        async ({ body, params, set, store }) => {
            const path = "posts.update.usecase"
            const { userId, scope } = store.auth

            const result = await Effect.runPromise(
                Effect.either(
                    PostService.update(params.id, body, userId, scope),
                ),
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
