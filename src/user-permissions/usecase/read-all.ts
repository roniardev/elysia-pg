import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";
import { eq, and, desc, asc, SQL, sql } from "drizzle-orm";

import { db } from "@/db";
import { userPermissions } from "@/db/schema/user-permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { handleResponse } from "@/utils/handle-response";
import {
  ResponseErrorStatus,
  ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { ManageUserPermission } from "@/common/enum/permissions";

import { readAllUserPermissionModel } from "../data/user-permissions.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const readAllUserPermission = new Elysia()
  .use(readAllUserPermissionModel)
  .use(jwtAccessSetup)
  .use(bearer())
  .get(
    "/user-permission",
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

      // Verify if user has permission to read user permissions
      const { valid } = await verifyPermission(
        ManageUserPermission.READ_USER_PERMISSION,
        existingUser.id,
      );

      if (!valid) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // READ ALL USER PERMISSIONS
      const { page = 1, limit = 10, includeRevoked = false } = query;
      const offset = (page - 1) * limit;

      let whereClause: SQL<unknown> = eq(userPermissions.userId, query.userId);
      
      if (!includeRevoked) {
        whereClause = and(whereClause, eq(userPermissions.revoked, false)) as SQL<unknown>;
      }

      const [userPermissionsCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(userPermissions)
        .where(whereClause);

      const userPermissionsList = await db.query.userPermissions.findMany({
        where: () => whereClause,
        with: {
          permission: true,
        },
        limit,
        offset,
        orderBy: [desc(userPermissions.createdAt)],
      });

      const totalPages = Math.ceil((userPermissionsCount?.count || 0) / limit);

      const response = {
        data: userPermissionsList.map((userPermission) => ({
          id: userPermission.id,
          userId: userPermission.userId,
          permissionId: userPermission.permissionId,
          revoked: userPermission.revoked,
          createdAt: userPermission.createdAt.toISOString(),
          updatedAt: userPermission.updatedAt?.toISOString() ?? null,
          permission: {
            id: userPermission.permission.id,
            name: userPermission.permission.name,
            description: userPermission.permission.description,
          },
        })),
        pagination: {
          page,
          limit,
          totalItems: userPermissionsCount?.count || 0,
          totalPages,
        },
      };

      return handleResponse(
        SuccessMessage.USER_PERMISSIONS_FETCHED,
        () => {
          set.status = ResponseSuccessStatus.OK;
        },
        response,
      );
    },
    {
      query: "readAllUserPermissionModel",
    },
  ); 