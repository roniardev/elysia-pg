import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllPostModel } from "@/src/posts/data/posts.model"
import { PostService } from "@/src/posts/service"

export const readAllPost = new Elysia()
    .use(readAllPostModel)
    .use(requirePermission(PostPermission.READ_ALL_POST, { scope: true }))
    .get(
        "/post",
        async ({ set, store, query }) => {
            const path = "posts.read-all.usecase"
            const { userId, scope } = store.auth

            return runService(PostService.readAll(query, userId, scope), {
                set,
                path,
                success: {
                    message: SuccessMessage.POSTS_FETCHED,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result.data,
                    attributes: (result) => result.attributes,
                },
            })
        },
        {
            query: "readAllPostModel",
        },
    )
