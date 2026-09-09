import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { readAuthStore, requirePermission } from "@/src/authorization/delivery/require_permission"
import { deletePostModel } from "@/src/posts/delivery/dto/post_request"
import { PostUsecase } from "@/src/posts/domain/usecase"

export const deletePost = new Elysia()
    .use(deletePostModel)
    .use(requirePermission(PostPermission.DELETE_POST))
    .delete("/post/:id", {
        params: "deletePostModel",
    }, async ({ params, set, store }) => {
        const path = "posts.delete.usecase"
        const { userId } = readAuthStore(store)

        return runService(PostUsecase.delete(params.id, userId), {
            set,
            path,
            success: {
                message: SuccessMessage.POST_DELETED,
                status: ResponseSuccessStatus.OK,
            },
        })
    })
