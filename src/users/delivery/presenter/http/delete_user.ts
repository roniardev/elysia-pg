import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { deleteUserModel } from "@/src/users/delivery/dto/user_request"
import { UserUsecase } from "@/src/users/domain/usecase"

export const deleteUser = new Elysia()
    .use(deleteUserModel)
    .use(requirePermission(UserPermission.DELETE_USER))
    .delete("/user/:id", {
        params: "deleteUserModel",
    }, async ({ params, set }) => {
        const path = "users.delete.usecase"

        return runService(
            UserUsecase.delete(params.id),
            {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_DELETED,
                    status: ResponseSuccessStatus.OK,
                },
            },
        )
    })
