import { Elysia } from "elysia"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import bearer from "@elysiajs/bearer"

import { ErrorMessage } from "@/common/enum/response-message"
import { verifyAuth } from "@/src/general/usecase/verify-auth"
import { createPermission } from "@/src/permissions/usecase/create"
import { deletePermission } from "@/src/permissions/usecase/delete"
import { readPermission } from "@/src/permissions/usecase/read"
import { readAllPermission } from "@/src/permissions/usecase/read-all"
import { updatePermission } from "@/src/permissions/usecase/update"

export const permissions = new Elysia()
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
                .use(createPermission)
                .use(readPermission)
                .use(readAllPermission)
                .use(updatePermission)
                .use(deletePermission),
    )
