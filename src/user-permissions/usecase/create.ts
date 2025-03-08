import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";
import { ulid } from "ulid";

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

import { createUserPermissionModel } from "../data/user-permissions.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const createUserPermission = new Elysia()
  .use(createUserPermissionModel)
  .use(jwtAccessSetup)
  .use(bearer())
  .post(
    "/user-permission",
    async ({ body, bearer, set, jwtAccess }) => {
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

      // Verify if user has permission to create user permissions
      const { valid } = await verifyPermission(
        ManageUserPermission.CREATE_USER_PERMISSION,
        existingUser.id,
      );

      if (!valid) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // Check if permission already exists and not revoked
      const existingPermission = await db.query.userPermissions.findFirst({
        where: (fields, { eq, and }) =>
          and(
            eq(fields.userId, body.userId),
            eq(fields.permissionId, body.permissionId),
            eq(fields.revoked, false)
          ),
      });

      if (existingPermission) {
        return handleResponse(ErrorMessage.PERMISSION_ALREADY_ASSIGNED, () => {
          set.status = ResponseErrorStatus.BAD_REQUEST;
        });
      }

      // CREATE USER PERMISSION
      const userPermissionId = ulid();

      try {
        await db.insert(userPermissions).values({
          id: userPermissionId,
          userId: body.userId,
          permissionId: body.permissionId,
        });
      } catch (error) {
        console.error(error);
        return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
          set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
        });
      }

      const response = {
        id: userPermissionId,
        userId: body.userId,
        permissionId: body.permissionId,
        revoked: false,
      };

      return handleResponse(
        SuccessMessage.USER_PERMISSION_CREATED,
        () => {
          set.status = ResponseSuccessStatus.CREATED;
        },
        response,
      );
    },
    {
      body: "createUserPermissionModel",
    },
  ); 