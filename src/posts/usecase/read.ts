import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { and } from "drizzle-orm"

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

import { getScope } from "@/src/general/usecase/get-scope"
import { readPostModel } from "../data/posts.model"
import {
    isOrganizationContextValid,
    buildPostQueryConditions
} from "../utils/scope-helpers"

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

            if (!isOrganizationContextValid(organizationId, scope)) {
                return handleResponse({
                    message: "Organization context required",
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // READ POST
            const conditions = buildPostQueryConditions({
                scope,
                organizationId,
                userId: validToken.id,
                postId: params.id,
            })

            const post = await db.query.posts.findFirst({
                where: () => and(...conditions),
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
