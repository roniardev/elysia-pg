import bearer from "@elysia/bearer"
import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { AuthUsecase } from "@/src/auth/domain/usecase"
import { runService } from "@/src/general/run_service"

export const logout = new Elysia()
    .use(bearer())
    .as("plugin")
    .post("/logout", {}, async ({
        bearer: token,
        set,
    }: {
        bearer?: string
        set: { status?: number | string }
    }) =>
        runService(AuthUsecase.logout(token), {
            set,
            path: "auth.logout.usecase",
            success: {
                message: SuccessMessage.LOGOUT_SUCCESS,
                status: ResponseSuccessStatus.ACCEPTED,
            },
        }))
