import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { forgotPasswordModel } from "@/src/auth/delivery/dto/auth_request"
import { AuthUsecase } from "@/src/auth/domain/usecase"
import { runService } from "@/src/general/run_service"

export const forgotPassword = new Elysia().use(forgotPasswordModel).post(
    "/forgot-password",
    async ({ body, set }) => runService(
        AuthUsecase.forgotPassword(body),
        {
            set,
            path: "auth.forgot-password.usecase",
            success: {
                message: SuccessMessage.EMAIL_SENT,
                status: ResponseSuccessStatus.OK,
            },
        },
    ),
    { body: "forgotPasswordModel" },
)
