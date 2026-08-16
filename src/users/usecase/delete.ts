import { eq } from "drizzle-orm"
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
import { getUser } from "@/src/general/usecase/get-user"
import { deleteUserModel } from "@/src/users/data/users.model"
import { handleResponse } from "@/utils/handle-response"
import { verrou } from "@/utils/services/locks"

export const deleteUser = new Elysia()
    .use(deleteUserModel)
    .use(requirePermission(UserPermission.DELETE_USER))
    .delete(
        "/user/:id",
        async ({ set, params }) => {
            const path = "users.delete.usecase"

            const existingUser = await getUser({
                identifier: params.id,
                type: "id",
            })

            if (!existingUser.user) {
                return handleResponse({
                    message: ErrorMessage.USER_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            if (existingUser.user.deletedAt) {
                return handleResponse({
                    message: ErrorMessage.USER_ALREADY_DELETED,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            const { user } = existingUser

            await verrou.createLock(`user:${user.id}`).run(async () => {
                try {
                    // await 15s
                    await new Promise((resolve) => setTimeout(resolve, 15000))

                    await db
                        .update(users)
                        .set({
                            deletedAt: new Date(),
                        })
                        .where(eq(users.id, user.id))
                } catch (error) {
                    console.error(error)
                    return handleResponse({
                        message: ErrorMessage.FAILED_TO_DELETE_USER,
                        callback: () => {
                            set.status =
                                ResponseErrorStatus.INTERNAL_SERVER_ERROR
                        },
                        path,
                    })
                }
            })

            return handleResponse({
                message: SuccessMessage.USER_DELETED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                path,
            })
        },
        {
            params: "deleteUserModel",
        },
    )
