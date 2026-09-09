import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { readAuthStore, requirePermission } from "@/src/authorization/delivery/require_permission"
import {
    getPostModel,
    updatePostModel,
} from "@/src/posts/delivery/dto/post_request"
import { PostUsecase } from "@/src/posts/domain/usecase"

export const updatePost = new Elysia()
    .use(updatePostModel)
    .use(getPostModel)
    .use(requirePermission(PostPermission.UPDATE_POST, { scope: true }))
    .put("/post/:id", {
        body: "updatePostModel",
        params: "getPostModel",
    }, async ({ params, body, set, store }) => {
        const path = "posts.update.usecase"
        const { userId, scope } = readAuthStore(store)

        return runService(
            PostUsecase.update(params.id, body, userId, scope),
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
    })
