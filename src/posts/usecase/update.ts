import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPostModel, updatePostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"

export const updatePost = new Elysia()
    .use(updatePostModel)
    .use(readPostModel)
    .use(requirePermission(PostPermission.UPDATE_POST, { scope: true }))
    .put(
        "/post/:id",
        async ({ params, body, set, store }) => {
            const path = "posts.update.usecase"
            const { userId, scope } = store.auth

            return runService(
                PostService.update(params.id, body, userId, scope),
                {
                    set,
                    path,
                    success: {
                        message: SuccessMessage.POST_UPDATED,
                        status: ResponseSuccessStatus.OK,
                        data: (result) => result,
                    },
                },
            )
        },
        {
            body: "updatePostModel",
            params: "readPostModel",
        },
    )
