import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { verifyEmailModel } from "@/src/auth/delivery/dto/auth_request"
import { AuthUsecase } from "@/src/auth/domain/usecase"
import { runService } from "@/src/general/run_service"

export const verifyEmail = new Elysia().use(verifyEmailModel).post("/verify-email", { body: "verifyEmailModel" }, async ({ body, set }) => runService(
    AuthUsecase.verifyEmail(body),
    {
        set,
        path: "auth.verify-email.usecase",
        success: {
            message: SuccessMessage.EMAIL_VERIFIED,
            status: ResponseSuccessStatus.OK,
        },
    },
))
