import bearer from "@elysiajs/bearer"
import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

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

import { PostPermission } from "@/common/enum/permissions"
import { Scope } from "@/common/enum/scopes"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { updatePostModel } from "../data/posts.model"

export const updatePost = new Elysia()
    .use(updatePostModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .put(
        "/post/:id",
        async ({ body, params, bearer, set, jwtAccess }) => {
            // CHECK VALID TOKEN
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
                    set.status = ResponseErrorStatus.FORBIDDEN
                })
            }

            // CHECK EXISTING USER
            const existingUser = await db.query.users.findFirst({
                where: (table, { eq }) => {
                    return eq(table.id, validToken.id)
                },
            })

            // CHECK EXISTING UPDATE POST PERMISSION
            const { valid, permission } = await verifyPermission(
                PostPermission.UPDATE_POST,
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

            if (!existingUser) {
                return handleResponse(ErrorMessage.INVALID_USER, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
                })
            }

            // CHECK EXISTING POST
            const existingPost = await db.query.posts.findFirst({
                where: (table, { eq, and }) => {
                    if (scope === Scope.PERSONAL) {
                        return and(
                            eq(table.id, params.id),
                            eq(table.userId, validToken.id),
                        )
                    }
                    return eq(table.id, params.id)
                },
            })

            if (!existingPost) {
                return handleResponse(ErrorMessage.POST_NOT_FOUND, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
                })
            }

            if (existingPost.userId !== existingUser.id) {
                return handleResponse(ErrorMessage.INVALID_USER, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
                })
            }

            await verrou
                .createLock(`updatePost:${existingPost.id}`)
                .run(async () => {
                    // UPDATE POST
                    try {
                        await db
                            .update(posts)
                            .set({
                                title: body.title || existingPost.title,
                                excerpt: body.excerpt || existingPost.excerpt,
                                content: body.content || existingPost.content,
                                status:
                                    (body.status as "draft" | "published") ||
                                    (existingPost.status as
                                        | "draft"
                                        | "published"),
                                visibility:
                                    (body.visibility as "public" | "private") ||
                                    (existingPost.visibility as
                                        | "public"
                                        | "private"),
                                tags: body.tags || existingPost.tags,
                                updatedAt: new Date(),
                            })
                            .where(eq(posts.id, existingPost.id))
                    } catch (error) {
                        console.error(error)
                        return handleResponse(
                            ErrorMessage.FAILED_TO_UPDATE_POST,
                            () => {
                                set.status =
                                    ResponseErrorStatus.INTERNAL_SERVER_ERROR
                            },
                        )
                    }
                })

            return handleResponse(SuccessMessage.POST_UPDATED, () => {
                set.status = ResponseSuccessStatus.OK
            })
        },
        {
            body: "updatePostModel",
        },
    )
