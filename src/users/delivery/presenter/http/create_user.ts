import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { createUserModel } from "@/src/users/delivery/dto/user_request"
import { UserUsecase } from "@/src/users/domain/usecase"

export const createUser = new Elysia()
    .use(createUserModel)
    .use(requirePermission(UserPermission.CREATE_USER))
    .post("/user", {
        body: "createUserModel",
    }, async ({ body, set }) => {
        const path = "users.create.usecase"

        return runService(
            UserUsecase.create(body),
            {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_CREATED,
                    status: ResponseSuccessStatus.CREATED,
                },
            },
        )
    })
