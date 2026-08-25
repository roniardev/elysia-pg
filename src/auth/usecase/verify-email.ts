import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { verifyEmailModel } from "@/src/auth/data/auth.model"
import { AuthService } from "@/src/auth/service"
import { runService } from "@/src/general/run-service"

export const verifyEmail = new Elysia().use(verifyEmailModel).post(
    "/verify-email",
    async ({ body, set }) => {
        const path = "auth.verify-email.usecase"

        return runService(AuthService.verifyEmail(body), {
            set,
            path,
            success: {
                message: SuccessMessage.EMAIL_VERIFIED,
                status: ResponseSuccessStatus.OK,
            },
        })
    },
    {
        body: "verifyEmailModel",
    },
)
