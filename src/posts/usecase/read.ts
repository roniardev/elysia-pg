import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { Scope } from "@/common/enum/scopes"
import { db } from "@/db"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readPostModel } from "@/src/posts/data/posts.model"
import { handleResponse } from "@/utils/handle-response"

export const readPost = new Elysia()
    .use(readPostModel)
    .use(requirePermission(PostPermission.READ_POST, { scope: true }))
    .get(
        "/post/:id",
        async ({ params, set, store }) => {
            const path = "posts.read.usecase"
            const { userId, scope } = store.auth

            // READ POST (single query, scope-aware)
            const post = await db.query.posts.findFirst({
                where: (table, { eq, and }) => {
                    if (scope === Scope.PERSONAL) {
                        return and(
                            eq(table.id, params.id),
                            eq(table.userId, userId),
                        )
                    }

                    return eq(table.id, params.id)
                },
            })

            if (!post) {
                return handleResponse({
                    message: ErrorMessage.POST_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.POST_READ,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: post,
                path,
            })
        },
        {
            params: "readPostModel",
        },
    )
