import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { db } from "@/db"
import { users } from "@/db/schema"
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllUserModel } from "@/src/users/data/users.model"
import { handleResponse } from "@/utils/handle-response"
import { getPagination } from "@/utils/pagination"

export const readAllUser = new Elysia()
    .use(readAllUserModel)
    .use(requirePermission(UserPermission.READ_ALL_USER))
    .get(
        "/user",
        async ({ set, query }) => {
            const path = "users.read-all.usecase"
            const { page, limit } = query

            const total = await db.$count(users)

            const usersList = await db.query.users.findMany({
                limit: Number(limit),
                offset: (Number(page) - 1) * Number(limit),
                with: {
                    permissions: true,
                },
            })

            const { totalPage, attributes } = getPagination(
                Number(page),
                Number(limit),
                total,
            )

            if (page > totalPage) {
                return handleResponse({
                    message: ErrorMessage.PAGE_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            return handleResponse({
                message: SuccessMessage.USER_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: usersList,
                attributes,
                path,
            })
        },
        {
            query: "readAllUserModel",
        },
    )
