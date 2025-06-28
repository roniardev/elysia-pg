import bearer from "@elysiajs/bearer"
import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { getScope } from "@/src/general/usecase/get-scope"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"

import { Scope } from "@/common/enum/scopes"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { deletePostModel } from "../data/posts.model"

export const deletePost = new Elysia()
    .use(deletePostModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .delete(
        "/post/:id",
        async ({ bearer, set, jwtAccess, params }) => {
            const path = "posts.delete.usecase"
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            // CHECK EXISTING DELETE POST PERMISSION
            const { valid, permission } = await verifyPermission(
                PostPermission.DELETE_POST,
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

            // CHECK EXISTING POST
            const existingPost = await db.query.posts.findFirst({
                where: (table, { eq, and }) => {
                    return and(
                        eq(table.id, params.id),
                        eq(table.userId, validToken.id),
                    )
                },
            })

            if (!existingPost) {
                return handleResponse({
                    message: ErrorMessage.POST_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }

            if (existingPost.userId !== validToken.id) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            await verrou
                .createLock(`deletePost:${existingPost.id}`)
                .run(async () => {
                    // DELETE POST
                    try {
                        await db
                            .delete(posts)
                            .where(eq(posts.id, existingPost.id))
                    } catch (error) {
                        console.error(error)
                        return handleResponse({
                            message: ErrorMessage.INTERNAL_SERVER_ERROR,
                            callback: () => {
                                set.status =
                                    ResponseErrorStatus.INTERNAL_SERVER_ERROR
                            },
                            path,
                        })
                    }
                })

            return handleResponse({
                message: SuccessMessage.POST_DELETED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        // {
        // 	params: "deletePostModel",
        // },
    )
