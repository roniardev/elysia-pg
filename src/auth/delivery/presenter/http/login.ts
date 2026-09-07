import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { basicAuthModel } from "@/src/auth/delivery/dto/auth_request"
import { AuthUsecase } from "@/src/auth/domain/usecase"
import { runService } from "@/src/general/run_service"

export const login = new Elysia().use(basicAuthModel).post(
    "/login",
    async ({ body, set }) => runService(
        AuthUsecase.login(body),
        {
            set,
            path: "auth.login.usecase",
            success: {
                message: SuccessMessage.LOGIN_SUCCESS,
                status: ResponseSuccessStatus.OK,
                data: (result) => result,
            },
        },
    ),
    { body: "basicAuthModel" },
)
