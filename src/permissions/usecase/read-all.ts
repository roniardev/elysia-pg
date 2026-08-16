import { and, asc, desc, isNull, like, type SQL } from "drizzle-orm"
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
import { requirePermission } from "@/src/general/setup/require-permission"
import { readAllPermissionModel } from "@/src/permissions/data/permissions.model"
import { handleResponse } from "@/utils/handle-response"
import { getPagination } from "@/utils/pagination"

export const readAllPermission = new Elysia()
    .use(readAllPermissionModel)
    .use(requirePermission(ManagePermission.READ_ALL_PERMISSION))
    .get(
        "/permissions",
        async ({ query, set }) => {
            const path = "permissions.read-all.usecase"
            const { page, limit, sort, search } = query

            // WHERE BUILDER: shared by list and total-count queries
            const buildPermissionWhere = (
                search: string | undefined,
            ): SQL | undefined => {
                const conditions = [isNull(permissions.deletedAt)]
                if (search) {
                    conditions.push(like(permissions.name, `%${search}%`))
                }
                return and(...conditions)
            }

            let orderBy = desc(permissions.createdAt)
            if (sort === Sorting.ASC) {
                orderBy = asc(permissions.createdAt)
            }

            const permissionsList = await db
                .select()
                .from(permissions)
                .where(buildPermissionWhere(search))
                .orderBy(orderBy)
                .limit(Number(limit))
                .offset((Number(page) - 1) * Number(limit))

            if (permissionsList.length === 0) {
                return handleResponse({
                    message: ErrorMessage.PERMISSION_NOT_FOUND,
                    callback: () => {
                        set.status = ResponseErrorStatus.NOT_FOUND
                    },
                    path,
                })
            }

            const total = await db.$count(
                permissions,
                buildPermissionWhere(search),
            )

            const { attributes } = getPagination(
                Number(page),
                Number(limit),
                total,
            )

            return handleResponse({
                message: SuccessMessage.PERMISSIONS_FETCHED,
                callback: () => {
                    set.status = ResponseSuccessStatus.OK
                },
                data: permissionsList,
                attributes,
            })
        },
        {
            query: "readAllPermissionModel",
        },
    )
