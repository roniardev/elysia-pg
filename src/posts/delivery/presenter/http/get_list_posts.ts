import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { readAuthStore, requirePermission } from "@/src/authorization/delivery/require_permission"
import { getListPostModel } from "@/src/posts/delivery/dto/post_request"
import { PostUsecase } from "@/src/posts/domain/usecase"

export const getListPosts = new Elysia()
    .use(getListPostModel)
    .use(requirePermission(PostPermission.READ_ALL_POST, { scope: true }))
    .get("/post", {
        query: "getListPostModel",
    }, async ({ set, store, query }) => {
        const path = "posts.read-all.usecase"
        const { userId, scope } = readAuthStore(store)

        return runService(
            PostUsecase.getList(query, userId, scope),
            {
                set,
                path,
                success: {
                    message: SuccessMessage.POSTS_FETCHED,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result.data,
                    attributes: (result) => result.attributes,
                },
            },
        )
    })
