import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { runService } from "@/src/general/run_service"
import { requirePermission } from "@/src/authorization/delivery/require_permission"
import { getListUserModel } from "@/src/users/delivery/dto/user_request"
import { UserUsecase } from "@/src/users/domain/usecase"

export const getListUsers = new Elysia()
    .use(getListUserModel)
    .use(requirePermission(UserPermission.READ_ALL_USER))
    .get("/user", {
        query: "getListUserModel",
    }, async ({ query, set }) => {
        const path = "users.get-list.usecase"

        return runService(
            UserUsecase.getList(query),
            {
                set,
                path,
                success: {
                    message: SuccessMessage.USER_FETCHED,
                    status: ResponseSuccessStatus.OK,
                    data: (result) => result.data,
                    attributes: (result) => result.attributes,
                },
            },
        )
    })
