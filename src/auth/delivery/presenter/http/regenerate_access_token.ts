import bearer from "@elysiajs/bearer"
import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { AuthUsecase } from "@/src/auth/domain/usecase"
import { runService } from "@/src/general/run_service"

export const regenerateAccessToken = new Elysia()
    .use(bearer())
    .get("/regenerate-access-token", async ({ bearer: token, set }) =>
        runService(
            AuthUsecase.regenerateAccessToken(token),
            {
                set,
                path: "auth.regenerate-access-token.usecase",
                success: {
                    message: SuccessMessage.ACCESS_TOKEN_REGENERATED,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result,
                },
            },
        ))
