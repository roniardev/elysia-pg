import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"
import { ErrorMessage } from "@/common/enum/response-message"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
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

                if (token && bearer) {
                    const { valid: isAuthorized } = await verifyAuth(
                        bearer,
                        token,
                    )
                    valid = isAuthorized
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
