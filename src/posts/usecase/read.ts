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
            // CHECK VALID TOKEN
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
                    set.status = ResponseErrorStatus.FORBIDDEN
                })
            }

            // CHECK EXISTING READ POST PERMISSION
            const { valid, permission } = await verifyPermission(
                PostPermission.READ_POST,
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

            // READ POST
            const post = await db.query.posts.findFirst({
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

            if (!post) {
                return handleResponse(ErrorMessage.POST_NOT_FOUND, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
                })
            }

            const readPost = await db.query.posts.findFirst({
                where: (table, { eq }) => {
                    return eq(table.id, params.id)
                },
            })

            if (!readPost) {
                return handleResponse(ErrorMessage.FAILED_TO_READ_POST, () => {
                    set.status = ResponseErrorStatus.BAD_REQUEST
                })
            }

            return handleResponse(
                SuccessMessage.POST_READ,
                () => {
                    set.status = ResponseSuccessStatus.OK
                },
                readPost,
            )
        },
        {
            params: "readPostModel",
        },
    )
