import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"

export const readPost = new Elysia()
    .use(readPostModel)
    .use(requirePermission(PostPermission.READ_POST, { scope: true }))
    .get(
        "/post/:id",
        async ({ params, set, store }) => {
            const path = "posts.read.usecase"
            const { userId, scope } = store.auth

            return runService(PostService.read(params.id, userId, scope), {
                set,
                path,
                success: {
                    message: SuccessMessage.POST_READ,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result,
                },
            })
        },
        {
            params: "readPostModel",
        },
    )
