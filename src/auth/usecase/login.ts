import { Elysia } from "elysia"

import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { basicAuthModel } from "@/src/auth/data/auth.model"
import { AuthService } from "@/src/auth/service"
import { runService } from "@/src/general/run-service"

export const login = new Elysia().use(basicAuthModel).post(
    "/login",
    async ({ body, set }) => {
        const path = "auth.login.usecase"

        return runService(AuthService.login(body), {
            set,
            path,
            success: {
                message: SuccessMessage.LOGIN_SUCCESS,
                status: ResponseSuccessStatus.OK,
                data: (result) => result,
            },
        })
    },
    {
        body: "basicAuthModel",
    },
)
