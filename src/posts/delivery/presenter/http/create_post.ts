import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { readAuthStore, requirePermission } from "@/src/authorization/delivery/require_permission"
import { createPostModel } from "@/src/posts/delivery/dto/post_request"
import { PostUsecase } from "@/src/posts/domain/usecase"

export const createPost = new Elysia()
    .use(createPostModel)
    .use(requirePermission(PostPermission.CREATE_POST))
    .post("/post", {
        body: "createPostModel",
    }, async ({ body, set, store }) => {
        const path = "posts.create.usecase"
        const { userId } = readAuthStore(store)

        return runService(PostUsecase.create(body, userId), {
            set,
            path,
            success: {
                message: SuccessMessage.POST_CREATED,
                status: ResponseSuccessStatus.CREATED,
                data: (result) => result,
            },
        })
    })
