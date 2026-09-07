import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { resetPasswordModel } from "@/src/auth/delivery/dto/auth_request"
import { AuthUsecase } from "@/src/auth/domain/usecase"
import { runService } from "@/src/general/run_service"

export const resetPassword = new Elysia().use(resetPasswordModel).post(
    "/reset-password",
    async ({ body, set }) => runService(
        AuthUsecase.resetPassword(body),
        {
            set,
            path: "auth.reset-password.usecase",
            success: {
                message: SuccessMessage.PASSWORD_RESET_SUCCESS,
                status: ResponseSuccessStatus.OK,
            },
        },
    ),
    { body: "resetPasswordModel" },
)
