import { Elysia } from "elysia"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import bearer from "@elysiajs/bearer"

import { ErrorMessage } from "@/common/enum/response-message"
import { verifyAuth } from "@/src/general/usecase/verify-auth"
import { createPost } from "@/src/posts/usecase/create"
import { deletePost } from "@/src/posts/usecase/delete"
import { readPost } from "@/src/posts/usecase/read"
import { readAllPost } from "@/src/posts/usecase/read-all"
import { updatePost } from "@/src/posts/usecase/update"

export const posts = new Elysia()
    .use(jwtAccessSetup)
    .use(bearer())
    .guard(
        {
            beforeHandle: async ({ bearer, jwtAccess, set }) => {
                const token = await jwtAccess.verify(bearer)
                let valid = false
                let message = ""

                if (token && bearer) {
                    const { valid: isAuthorized, message: authMessage } =
                        await verifyAuth(bearer, token)
                    valid = isAuthorized
                    message = authMessage
                }

                if (!valid) {
                    set.status = 401
                    return {
                        status: false,
                        message: ErrorMessage.UNAUTHORIZED,
                    }
                }
            },
        },
        (app) =>
            app
                .use(createPost)
                .use(readAllPost)
                .use(deletePost)
                .use(readPost)
                .use(updatePost),
    )
