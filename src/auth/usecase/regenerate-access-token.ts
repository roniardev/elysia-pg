import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { AuthService } from "@/src/auth/service"
import { runService } from "@/src/general/run-service"

export const regenerateAccessToken = new Elysia()
    .use(bearer())
    .get("/regenerate-access-token", async ({ bearer, set }) => {
        const path = "auth.regenerate-access-token.usecase"

        return runService(AuthService.regenerateAccessToken(bearer), {
            set,
            path,
            success: {
                message: SuccessMessage.ACCESS_TOKEN_REGENERATED,
                status: ResponseSuccessStatus.OK,
                data: (result) => result,
            },
        })
    })
