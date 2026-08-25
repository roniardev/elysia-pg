import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { registerModel } from "@/src/auth/data/auth.model"
import { AuthService } from "@/src/auth/service"
import { runService } from "@/src/general/run-service"

export const register = new Elysia().use(registerModel).post(
    "/register",
    async ({ body, set }) => {
        const path = "auth.register.usecase"

        return runService(AuthService.register(body), {
            set,
            path,
            success: {
                message: SuccessMessage.USER_REGISTERED,
                status: ResponseSuccessStatus.CREATED,
            },
        })
    },
    {
        body: "registerModel",
    },
)
