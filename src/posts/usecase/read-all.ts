import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import Sorting from "@/common/enum/sorting"
import { db } from "@/db"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"
import { getUser } from "@/src/general/usecase/get-user"
import { Scope } from "@/common/enum/scopes"
import { posts } from "@/db/schema"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { getScope } from "@/src/general/usecase/get-scope"
import { and, eq, like, sql } from "drizzle-orm"
import { readAllPostModel } from "../data/posts.model"

export const readAllPost = new Elysia()
    .use(readAllPostModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .get(
        "/post",
        async ({ bearer, set, jwtAccess, query }) => {
            const path = "posts.read-all.usecase"
            // CHECK VALID TOKEN
            const validToken = await jwtAccess.verify(bearer)
            const { page, limit, sort, search } = query

            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // CHECK EXISTING READ ALL POST PERMISSION
            const { valid, permission } = await verifyPermission(
                PostPermission.READ_ALL_POST,
                validToken.id,
            )

            if (!valid || !permission) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED_PERMISSION,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            const scope = await getScope(permission)

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: validToken.id,
                type: "id",
                condition: {
                    deleted: false,
                },
            })

            if (!existingUser.user) {
                return handleResponse({
                    message: ErrorMessage.INVALID_USER,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // GET ALL POSTS
            const postsRes = await db.query.posts.findMany({
                where: (table, { eq, like, and }) => {
                    if (scope === Scope.PERSONAL) {
                        return and(
                            eq(
                                table.userId,
                                existingUser.user?.id || validToken.id,
                            ),
                            search
                                ? like(table.title, `%${search}%`)
                                : undefined,
                        )
                    }

                    return search ? like(table.title, `%${search}%`) : undefined
                },
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
            const whereConditions = []
            if (scope === Scope.PERSONAL) {
                whereConditions.push(eq(posts.userId, existingUser.user.id))
            }
            if (search) {
                whereConditions.push(like(posts.title, `%${search}%`))
            }

            const totalAllData = await db
                .select({ count: sql<number>`count(*)` })
                .from(posts)
                .where(
                    whereConditions.length > 0
                        ? and(...whereConditions)
                        : undefined,
                )

            const total = Number(totalAllData[0]?.count || 0)
            const totalPage = Math.ceil(total / Number(limit))

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
                attributes: {
                    total,
                    page: Number(page),
                    limit: Number(limit),
                    totalPage,
                },
                path,
            })
        },
        {
            query: "readAllPostModel",
        },
    )
