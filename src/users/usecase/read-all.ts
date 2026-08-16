import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllUserModel } from "@/src/users/data/users.model"
import { UserService } from "@/src/users/service"

export const readAllUser = new Elysia()
    .use(readAllUserModel)
    .use(requirePermission(UserPermission.READ_ALL_USER))
    .get(
        "/user",
        async ({ query, set }) => {
            const path = "users.read-all.usecase"

            return runService(UserService.readAll(query), {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_FETCHED,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result.data,
                    attributes: (result) => result.attributes,
                },
            })
        },
        {
            query: "readAllUserModel",
        },
    )
