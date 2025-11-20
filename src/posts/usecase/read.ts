import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { PostPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"

import { Scope } from "@/common/enum/scopes"
import { getScope } from "@/src/general/usecase/get-scope"
import { readPostModel } from "../data/posts.model"

export const readPost = new Elysia()
    .use(readPostModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .get(
        "/post/:id",
        async ({ params, bearer, set, jwtAccess }) => {
            const path = "posts.read.usecase"
            // CHECK VALID TOKEN
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

            // CHECK EXISTING READ POST PERMISSION
            const { valid, permission } = await verifyPermission(
                PostPermission.READ_POST,
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
            const organizationId = validToken.organizationId

            if (!organizationId && scope !== Scope.GLOBAL && scope !== Scope.SUPER_ADMIN) {
                return handleResponse({
                    message: "Organization context required",
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // READ POST
            const post = await db.query.posts.findFirst({
                where: (table, { eq, and }) => {
                    const conditions = [eq(table.id, params.id)]

                    if (scope === Scope.PERSONAL) {
                        conditions.push(eq(table.userId, validToken.id))
                        if (organizationId) {
                            conditions.push(eq(table.organizationId, organizationId))
                        }
                    }

                    if (scope === Scope.ORGANIZATION && organizationId) {
                        conditions.push(eq(table.organizationId, organizationId))
                    }

                    return and(...conditions)
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

            const readPost = post

            return handleResponse({
                message: SuccessMessage.POST_READ,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: readPost,
                path,
            })
        },
        {
            params: "readPostModel",
        },
    )
