import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deletePostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"

export const deletePost = new Elysia()
    .use(deletePostModel)
    .use(requirePermission(PostPermission.DELETE_POST))
    .delete(
        "/post/:id",
        async ({ params, set, store }) => {
            const path = "posts.delete.usecase"
            const { userId } = store.auth

            return runService(PostService.delete(params.id, userId), {
                set,
                path,
                success: {
                    message: SuccessMessage.POST_DELETED,
                    status: ResponseSuccessStatus.OK,
                },
            })
        },
        {
            params: "deletePostModel",
        },
    )
