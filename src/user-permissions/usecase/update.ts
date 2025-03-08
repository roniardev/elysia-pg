import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";
import { eq } from "drizzle-orm";

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

import { updateUserPermissionModel, readUserPermissionModel } from "../data/user-permissions.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const updateUserPermission = new Elysia()
  .use(updateUserPermissionModel)
  .use(readUserPermissionModel)
  .use(jwtAccessSetup)
  .use(bearer())
  .patch(
    "/user-permission/:id",
    async ({ params, body, bearer, set, jwtAccess }) => {
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

      // Verify if user has permission to update user permissions
      const { valid } = await verifyPermission(
        ManageUserPermission.UPDATE_USER_PERMISSION,
        existingUser.id,
      );

      if (!valid) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // Check if user permission exists
      const existingUserPermission = await db.query.userPermissions.findFirst({
        where: (fields, { eq }) => eq(fields.id, params.id),
      });

      if (!existingUserPermission) {
        return handleResponse(ErrorMessage.USER_PERMISSION_NOT_FOUND, () => {
          set.status = ResponseErrorStatus.NOT_FOUND;
        });
      }

      // UPDATE USER PERMISSION
      try {
        const [updatedUserPermission] = await db
          .update(userPermissions)
          .set({
            revoked: body.revoked,
            updatedAt: new Date(),
          })
          .where(eq(userPermissions.id, params.id))
          .returning();

        if (!updatedUserPermission) {
          return handleResponse(ErrorMessage.USER_PERMISSION_NOT_FOUND, () => {
            set.status = ResponseErrorStatus.NOT_FOUND;
          });
        }

        const response = {
          id: updatedUserPermission.id,
          userId: updatedUserPermission.userId,
          permissionId: updatedUserPermission.permissionId,
          revoked: updatedUserPermission.revoked,
          createdAt: updatedUserPermission.createdAt.toISOString(),
          updatedAt: updatedUserPermission.updatedAt?.toISOString() ?? null,
        };

        return handleResponse(
          SuccessMessage.USER_PERMISSION_UPDATED,
          () => {
            set.status = ResponseSuccessStatus.OK;
          },
          response,
        );
      } catch (error) {
        console.error(error);
        return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
          set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
        });
      }
    },
    {
      params: "readUserPermissionModel",
      body: "updateUserPermissionModel",
    },
  ); 