import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { getPostModel } from "@/src/posts/delivery/dto/post_request"
import { PostUsecase } from "@/src/posts/domain/usecase"

export const getPost = new Elysia()
    .use(getPostModel)
    .use(requirePermission(PostPermission.READ_POST, { scope: true }))
    .get(
        "/post/:id",
        async ({ params, set, store }) => {
            const path = "posts.read.usecase"
            const { userId, scope } = store.auth

            return runService(
                PostUsecase.get(params.id, userId, scope),
                {
                    set,
                    path,
                    success: {
                        message: SuccessMessage.POST_READ,
                        status: ResponseSuccessStatus.OK,
                        data: (result) => result,
                    },
                },
            )
        },
        {
            params: "getPostModel",
        },
    )
