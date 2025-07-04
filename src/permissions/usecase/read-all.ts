import bearer from "@elysiajs/bearer"
import { isNull, sql } from "drizzle-orm"
import { Elysia } from "elysia"

import { ManagePermission } from "@/common/enum/permissions"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import {
    ResponseErrorStatus,
    ResponseSuccessStatus,
} from "@/common/enum/response-status"
import Sorting from "@/common/enum/sorting"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"
import { getUser } from "@/src/general/usecase/get-user"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { readAllPermissionModel } from "../data/permissions.model"

export const readAllPermission = new Elysia()
    .use(readAllPermissionModel)
    .use(jwtAccessSetup)
    .use(bearer())
    .get(
        "/permissions",
        async ({ query, bearer, set, jwtAccess }) => {
            const path = "permissions.read-all.usecase"
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

            // CHECK EXISTING USER
            const existingUser = await getUser({
                identifier: validToken.id,
                type: "id",
                condition: {
                    deleted: false,
                },
            })

            if (!existingUser.user) {
                return handleResponse({
                    message: ErrorMessage.INVALID_USER,
                    callback: () => {
                        set.status = ResponseErrorStatus.BAD_REQUEST
                    },
                    path,
                })
            }

            // VERIFY IF USER HAS PERMISSION TO READ ALL PERMISSIONS
            const { valid } = await verifyPermission(
                ManagePermission.READ_ALL_PERMISSION,
                existingUser.user.id,
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

            // READ ALL PERMISSIONS
            try {
                const page = query.page || 1
                const limit = query.limit || 10
                const offset = (page - 1) * limit
                const sort = query.sort || Sorting.DESC
                const search = query.search || ""

                const whereQuery = [`${permissions.deletedAt} IS NULL`]
                let orderByQuery = sql`${permissions.createdAt} DESC`

                if (search !== "") {
                    whereQuery.push(`${permissions.name} LIKE ${`%${search}%`}`)
                }

                if (sort === Sorting.ASC) {
                    orderByQuery = sql`${permissions.createdAt} ASC`
                }

                const baseQuery = db
                    .select()
                    .from(permissions)
                    .where(sql`${whereQuery.join(" AND ")}`)
                    .orderBy(orderByQuery)
                    .limit(limit)
                    .offset(offset)

                const permissionsList = await baseQuery
                if (permissionsList.length === 0) {
                    return handleResponse({
                        message: ErrorMessage.PERMISSION_NOT_FOUND,
                        callback: () => {
                            set.status = ResponseErrorStatus.NOT_FOUND
                        },
                        path,
                    })
                }

                const totalPermissions = await db
                    .select({ count: sql<number>`count(*)` })
                    .from(permissions)
                    .where(isNull(permissions.deletedAt))

                const totalPage = Math.ceil(
                    (totalPermissions[0]?.count || 0) / limit,
                )

                return handleResponse({
                    message: SuccessMessage.PERMISSIONS_FETCHED,
                    callback: () => {
                        set.status = ResponseSuccessStatus.OK
                    },
                    data: permissionsList,
                    attributes: {
                        page: Number(page),
                        limit: Number(limit),
                        totalPage: Number(totalPage),
                        total: Number(totalPermissions[0]?.count || 0),
                    },
                })
            } catch (error) {
                console.error(error)
                return handleResponse({
                    message: ErrorMessage.INTERNAL_SERVER_ERROR,
                    callback: () => {
                        set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
                    },
                    path,
                })
            }
        },
        {
            query: "readAllPermissionModel",
        },
    )
