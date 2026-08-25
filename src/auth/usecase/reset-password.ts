import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { resetPasswordModel } from "@/src/auth/data/auth.model"
import { AuthService } from "@/src/auth/service"
import { runService } from "@/src/general/run-service"

export const resetPassword = new Elysia().use(resetPasswordModel).post(
    "/reset-password",
    async ({ body, set }) => {
        const path = "auth.reset-password.usecase"

        return runService(AuthService.resetPassword(body), {
            set,
            path,
            success: {
                message: SuccessMessage.PASSWORD_RESET_SUCCESS,
                status: ResponseSuccessStatus.OK,
            },
        })
    },
    {
        body: "resetPasswordModel",
    },
)
