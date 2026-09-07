import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { getUserModel } from "@/src/users/delivery/dto/user_request"
import { UserUsecase } from "@/src/users/domain/usecase"

export const getUser = new Elysia()
    .use(getUserModel)
    .use(requirePermission(UserPermission.READ_USER))
    .get(
        "/user/:id",
        async ({ params, set }) => {
            const path = "users.get.usecase"

            return runService(
                UserUsecase.get(params.id),
                {
                    set,
                    path,
                    success: {
                        message: SuccessMessage.USER_FOUND,
                        status: ResponseSuccessStatus.OK,
                        data: (result) => result,
                    },
                },
            )
        },
        {
            params: "getUserModel",
        },
    )
