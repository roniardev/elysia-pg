import { Effect } from "effect"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"
import { handleResponse } from "@/utils/handle-response"

export const readPost = new Elysia()
    .use(readPostModel)
    .use(requirePermission(PostPermission.READ_POST, { scope: true }))
    .get(
        "/post/:id",
        async ({ params, set, store }) => {
            const path = "posts.read.usecase"
            const { userId, scope } = store.auth

            const result = await Effect.runPromise(
                Effect.either(PostService.read(params.id, userId, scope)),
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
                message: SuccessMessage.POST_READ,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right,
                path,
            })
        },
        {
            params: "readPostModel",
        },
    )
