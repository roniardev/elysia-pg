import { Effect } from "effect"
import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { SuccessMessage } from "@/common/enum/response-message"
import { ResponseSuccessStatus } from "@/common/enum/response-status"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllUserModel } from "@/src/users/data/users.model"
import { UserService } from "@/src/users/service"
import { handleResponse } from "@/utils/handle-response"

export const readAllUser = new Elysia()
    .use(readAllUserModel)
    .use(requirePermission(UserPermission.READ_ALL_USER))
    .get(
        "/user",
        async ({ set, query }) => {
            const path = "users.read-all.usecase"

            const result = await Effect.runPromise(
                Effect.either(UserService.readAll(query)),
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
                message: SuccessMessage.USER_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: result.right.data,
                attributes: result.right.attributes,
                path,
            })
        },
        {
            query: "readAllUserModel",
        },
    )
