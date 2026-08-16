import { and, eq, like, type SQL } from "drizzle-orm"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { Scope } from "@/common/enum/scopes"
import Sorting from "@/common/enum/sorting"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllPostModel } from "@/src/posts/data/posts.model"
import { handleResponse } from "@/utils/handle-response"
import { getPagination } from "@/utils/pagination"

export const readAllPost = new Elysia()
    .use(readAllPostModel)
    .use(requirePermission(PostPermission.READ_ALL_POST, { scope: true }))
    .get(
        "/post",
        async ({ set, store, query }) => {
            const path = "posts.read-all.usecase"
            const { userId, scope } = store.auth
            const { page, limit, sort, search } = query

            // WHERE BUILDER: shared by list and total-count queries
            const buildPostWhere = (
                scope: string | null,
                search: string | undefined,
            ): SQL | undefined => {
                const conditions = []
                if (scope === Scope.PERSONAL) {
                    conditions.push(eq(posts.userId, userId))
                }
                if (search) {
                    conditions.push(like(posts.title, `%${search}%`))
                }
                return and(...conditions)
            }

            // GET ALL POSTS
            const postsRes = await db.query.posts.findMany({
                where: buildPostWhere(scope, search),
                limit: Number(limit),
                offset: (Number(page) - 1) * Number(limit),
                orderBy: (table, { desc: descFn, asc: ascFn }) => {
                    if (sort === Sorting.ASC) {
                        return ascFn(table.createdAt)
                    }
                    return descFn(table.createdAt)
                },
                with: {
                    user: {
                        columns: {
                            id: true,
                        },
                    },
                },
            })

            // Get total count based on scope and search
            const total = await db.$count(posts, buildPostWhere(scope, search))

            const { totalPage, attributes } = getPagination(
                Number(page),
                Number(limit),
                total,
            )

            if (page > totalPage) {
                return handleResponse({
                    message: ErrorMessage.PAGE_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.POSTS_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: postsRes,
                attributes,
                path,
            })
        },
        {
            query: "readAllPostModel",
        },
    )
