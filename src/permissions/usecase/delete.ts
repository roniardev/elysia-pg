import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { permissions } from "@/db/schema/permission";
import { PermissionPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { handleResponse } from "@/utils/handle-response";
import {
  ResponseErrorStatus,
  ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";

import { deletePermissionModel } from "../data/permissions.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { eq } from "drizzle-orm";

export const deletePermission = new Elysia()
  .use(deletePermissionModel)
  .use(jwtAccessSetup)
  .use(bearer())
  .delete(
    "/permission/:id",
    async ({ params, bearer, set, jwtAccess }) => {
      // CHECK VALID TOKEN
      if (!bearer) {
        return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

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

      // Verify if user has permission to delete permissions
      const { valid } = await verifyPermission(
        PermissionPermission.DELETE_PERMISSION,
        existingUser.id,
      );

      if (!valid) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // Check if permission exists
      const existingPermission = await db.query.permissions.findFirst({
        where: (table, { eq, and, isNull }) => {
          return and(eq(table.id, params.id), isNull(table.deletedAt));
        },
      });

      if (!existingPermission) {
        return handleResponse(ErrorMessage.PERMISSION_NOT_FOUND, () => {
          set.status = ResponseErrorStatus.NOT_FOUND;
        });
      }

      // SOFT DELETE PERMISSION
      try {
        await db
          .update(permissions)
          .set({
            deletedAt: new Date(),
          })
          .where(eq(permissions.id, params.id));

        return handleResponse(
          SuccessMessage.PERMISSION_DELETED,
          () => {
            set.status = ResponseSuccessStatus.OK;
          },
        );
      } catch (error) {
        console.error(error);
        return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
          set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
        });
      }
    },
    {
      params: "deletePermissionModel",
    },
  ); 