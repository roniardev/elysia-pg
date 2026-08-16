import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readUserModel } from "@/src/users/data/users.model"
import { UserService } from "@/src/users/service"

export const readUser = new Elysia()
    .use(readUserModel)
    .use(requirePermission(UserPermission.READ_USER))
    .get(
        "/user/:id",
        async ({ params, set }) => {
            const path = "users.read.usecase"

            return runService(UserService.read(params.id), {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_FOUND,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result,
                },
            })
        },
        {
            params: "readUserModel",
        },
    )
