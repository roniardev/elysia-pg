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
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
                    set.status = ResponseErrorStatus.FORBIDDEN
                })
            }

            // CHECK EXISTING DELETE POST PERMISSION
            const { valid, permission } = await verifyPermission(
                PostPermission.DELETE_POST,
                validToken.id,
            )

            if (!valid || !permission) {
                return handleResponse(
                    ErrorMessage.UNAUTHORIZED_PERMISSION,
                    () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                )
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
                return handleResponse(ErrorMessage.POST_NOT_FOUND, () => {
                    set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                })
            }

            if (existingPost.userId !== validToken.id) {
                return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
                    set.status = ResponseErrorStatus.FORBIDDEN
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
                        return handleResponse(
                            ErrorMessage.INTERNAL_SERVER_ERROR,
                            () => {
                                set.status =
                                    ResponseErrorStatus.INTERNAL_SERVER_ERROR
                            },
                        )
                    }
                })

            return handleResponse(SuccessMessage.POST_DELETED, () => {
                set.status = ResponseSuccessStatus.OK
            })
        },
        // {
        // 	params: "deletePostModel",
        // },
    )
