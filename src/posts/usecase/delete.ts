import { Effect } from "effect"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deletePostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"
import { handleResponse } from "@/utils/handle-response"

export const deletePost = new Elysia()
    .use(deletePostModel)
    .use(requirePermission(PostPermission.DELETE_POST))
    .delete("/post/:id", async ({ set, store, params }) => {
        const path = "posts.delete.usecase"
        const { userId } = store.auth

        const result = await Effect.runPromise(
            Effect.either(PostService.delete(params.id, userId)),
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
            message: SuccessMessage.POST_DELETED,
            callback: () => {
                set.status = ResponseSuccessStatus.OK
            },
            path,
        })
    })
