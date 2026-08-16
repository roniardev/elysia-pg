import { Effect } from "effect"
import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { createUserModel } from "@/src/users/data/users.model"
import { UserService } from "@/src/users/service"
import { handleResponse } from "@/utils/handle-response"

export const createUser = new Elysia()
    .use(createUserModel)
    .use(requirePermission(UserPermission.CREATE_USER))
    .post(
        "/user",
        async ({ body, set }) => {
            const path = "users.create.usecase"

            const result = await Effect.runPromise(
                Effect.either(UserService.create(body)),
            )

            if (result._tag === "Left") {
                return handleResponse({
                    message: result.left.message,
                    callback: () => {
                        set.status = result.left.status
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.USER_CREATED,
                callback: () => {
                    set.status = ResponseSuccessStatus.CREATED
                },
                path,
            })
        },
        {
            body: "createUserModel",
        },
    )
