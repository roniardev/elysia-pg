import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run-service"
import { requirePermission } from "@/src/general/setup/require-permission"
import { deleteUserModel } from "@/src/users/data/users.model"
import { UserService } from "@/src/users/service"

export const deleteUser = new Elysia()
    .use(deleteUserModel)
    .use(requirePermission(UserPermission.DELETE_USER))
    .delete(
        "/user/:id",
        async ({ params, set }) => {
            const path = "users.delete.usecase"

            return runService(UserService.delete(params.id), {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_DELETED,
                    status: ResponseSuccessStatus.OK,
                },
            })
        },
        {
            params: "deleteUserModel",
        },
    )
