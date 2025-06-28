import { Elysia } from "elysia"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import bearer from "@elysiajs/bearer"

import { verifyAuth } from "../general/usecase/verify-auth"
import { createUser } from "./usecase/create"
import { deleteUser } from "./usecase/delete"
import { readUser } from "./usecase/read"
import { readAllUser } from "./usecase/read-all"

export const users = new Elysia()
    .use(jwtAccessSetup)
    .use(bearer())
    .guard(
        {
            beforeHandle: async ({ bearer, jwtAccess, set }) => {
                const token = await jwtAccess.verify(bearer)
                let valid = false
                let message = "Unauthorized"

                if (token && bearer) {
                    const { valid: isAuthorized, message: authMessage } =
                        await verifyAuth(bearer, token)
                    valid = isAuthorized
                    message = authMessage
                }

                if (!valid) {
                    set.status = 401
                    return {
                        message,
                    }
                }
            },
        },
        (app) =>
            app.use(createUser).use(readUser).use(deleteUser).use(readAllUser),
    )
