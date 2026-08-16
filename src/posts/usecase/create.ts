import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createPostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"

export const createPost = new Elysia()
    .use(createPostModel)
    .use(requirePermission(PostPermission.CREATE_POST))
    .post(
        "/post",
        async ({ body, set, store }) => {
            const path = "posts.create.usecase"
            const { userId } = store.auth

            return runService(PostService.create(body, userId), {
                set,
                path,
                success: {
                    message: SuccessMessage.POST_CREATED,
                    status: ResponseSuccessStatus.CREATED,
                    data: (result) => result,
                },
            })
        },
        {
            body: "createPostModel",
        },
    )
