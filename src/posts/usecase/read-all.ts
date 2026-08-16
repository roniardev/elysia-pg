import { Effect } from "effect"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllPostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"
import { handleResponse } from "@/utils/handle-response"

export const readAllPost = new Elysia()
    .use(readAllPostModel)
    .use(requirePermission(PostPermission.READ_ALL_POST, { scope: true }))
    .get(
        "/post",
        async ({ set, store, query }) => {
            const path = "posts.read-all.usecase"
            const { userId, scope } = store.auth

            const result = await Effect.runPromise(
                Effect.either(PostService.readAll(query, userId, scope)),
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
                message: SuccessMessage.POSTS_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right.data,
                attributes: result.right.attributes,
                path,
            })
        },
        {
            query: "readAllPostModel",
        },
    )
