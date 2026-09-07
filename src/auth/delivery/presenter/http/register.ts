import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { registerModel } from "@/src/auth/delivery/dto/auth_request"
import { AuthUsecase } from "@/src/auth/domain/usecase"
import { runService } from "@/src/general/run_service"

export const register = new Elysia().use(registerModel).post(
    "/register",
    async ({ body, set }) => runService(
        AuthUsecase.register(body),
        {
            set,
            path: "auth.register.usecase",
            success: {
                message: SuccessMessage.USER_REGISTERED,
                status: ResponseSuccessStatus.CREATED,
            },
        },
    ),
    { body: "registerModel" },
)
