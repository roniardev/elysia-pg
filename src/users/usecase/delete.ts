import bearer from "@elysiajs/bearer"
import { eq } from "drizzle-orm"
import { Elysia } from "elysia"

import { UserPermission } from "@/common/enum/permissions"
import { db } from "@/db"
import { users } from "@/db/schema"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { verrou } from "@/utils/services/locks"

import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { getUser } from "@/src/general/usecase/get-user"
import { handleResponse } from "@/utils/handle-response"
import { deleteUserModel } from "../data/users.model"
export const deleteUser = new Elysia()
    .use(deleteUserModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .delete(
        "/user/:id",
        async ({ bearer, set, jwtAccess, params }) => {
            const path = "users.delete.usecase"
            // CHECK VALID TOKEN
            const validToken = await jwtAccess.verify(bearer)

            if (!validToken) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

            const { valid } = await verifyPermission(
                UserPermission.DELETE_USER,
                validToken.id,
            )

            if (!valid) {
                return handleResponse({
                    message: ErrorMessage.UNAUTHORIZED_PERMISSION,
                    callback: () => {
                        set.status = ResponseErrorStatus.FORBIDDEN
                    },
                    path,
                })
            }

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
