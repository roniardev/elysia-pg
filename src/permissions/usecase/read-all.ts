import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";
import { isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { permissions } from "@/db/schema/permission";
import { ManagePermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { handleResponse } from "@/utils/handle-response";
import {
  ResponseErrorStatus,
  ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import Sorting from "@/common/enum/sorting";

import { readAllPermissionModel } from "../data/permissions.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const readAllPermission = new Elysia()
  .use(readAllPermissionModel)
  .use(jwtAccessSetup)
  .use(bearer())
  .get(
    "/permissions",
    async ({ query, bearer, set, jwtAccess }) => {
      const validToken = await jwtAccess.verify(bearer);
      if (!validToken) {
        return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // CHECK EXISTING USER
      const existingUser = await db.query.users.findFirst({
        where: (table, { eq, and, isNull }) => {
          return and(eq(table.id, validToken.id), isNull(table.deletedAt));
        },
      });

      if (!existingUser) {
        return handleResponse(ErrorMessage.INVALID_USER, () => {
          set.status = ResponseErrorStatus.BAD_REQUEST;
        });
      }

      // Verify if user has permission to read all permissions
      const { valid } = await verifyPermission(
        ManagePermission.READ_ALL_PERMISSION,
        existingUser.id,
      );

      if (!valid) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // READ ALL PERMISSIONS
      try {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const offset = (page - 1) * limit;
        const sort = query.sort || Sorting.DESC;
        const search = query.search || "";

        const baseQuery = db
          .select()
          .from(permissions)
          .where(sql`${permissions.deletedAt} IS NULL`)
          .orderBy(
            sort === Sorting.ASC
              ? sql`${permissions.createdAt} ASC`
              : sql`${permissions.createdAt} DESC`,
          )
          .limit(limit)
          .offset(offset);

        let permissionsList = await baseQuery;

        if (search) {
          permissionsList = await db
            .select()
            .from(permissions)
            .where(
              sql`${permissions.name} LIKE ${`%${search}%`} AND ${
                permissions.deletedAt
              } IS NULL`,
            )
            .orderBy(
              sort === Sorting.ASC
                ? sql`${permissions.createdAt} ASC`
                : sql`${permissions.createdAt} DESC`,
            )
            .limit(limit)
            .offset(offset);
        }

        const totalPermissions = await db
          .select({ count: sql<number>`count(*)` })
          .from(permissions)
          .where(isNull(permissions.deletedAt));

        console.log({
          TP: totalPermissions
        });

        const totalPage = Math.ceil((totalPermissions[0]?.count || 0) / limit);

        return handleResponse(
          SuccessMessage.PERMISSIONS_FETCHED,
          () => {
            set.status = ResponseSuccessStatus.OK;
          },
          {
            data: permissionsList,
          }, {
            page: Number(page),
            limit: Number(limit),
            totalPage: Number(totalPage),
            total: Number(totalPermissions[0]?.count || 0),
          }
        );
      } catch (error) {
        console.error(error);
        return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
          set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
        });
      }
    },
    {
      query: "readAllPermissionModel",
    },
  ); 