import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createUserModel } from "@/src/users/data/users.model"
import { UserService } from "@/src/users/service"

export const createUser = new Elysia()
    .use(createUserModel)
    .use(requirePermission(UserPermission.CREATE_USER))
    .post(
        "/user",
        async ({ body, set }) => {
            const path = "users.create.usecase"

            return runService(UserService.create(body), {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_CREATED,
                    status: ResponseSuccessStatus.CREATED,
                },
            })
        },
        {
            body: "createUserModel",
        },
    )
