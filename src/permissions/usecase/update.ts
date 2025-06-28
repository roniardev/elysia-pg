import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

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

import { readPermissionModel, updatePermissionModel } from "../data/permissions.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { eq } from "drizzle-orm";

export const updatePermission = new Elysia()
  .use(updatePermissionModel)
  .use(readPermissionModel)
  .use(jwtAccessSetup)
  .use(bearer())
  .put(
    "/permission/:id",
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

      // VERIFY IF USER HAS PERMISSION TO UPDATE PERMISSIONS
      const { valid } = await verifyPermission(
        ManagePermission.UPDATE_PERMISSION,
        existingUser.id,
      );

      if (!valid) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // CHECK IF PERMISSION EXISTS
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

      // UPDATE PERMISSION
      try {
        await db
          .update(permissions)
          .set({
            name: body.name || existingPermission.name,
            description: body.description !== undefined ? body.description : existingPermission.description,
            updatedAt: new Date(),
          })
          .where(eq(permissions.id, params.id));

        const updatedPermission = await db.query.permissions.findFirst({
          where: (table, { eq }) => eq(table.id, params.id),
        });

        if (!updatedPermission) {
          return handleResponse(ErrorMessage.PERMISSION_NOT_FOUND, () => {
            set.status = ResponseErrorStatus.NOT_FOUND;
          });
        }

        const response = {
          id: updatedPermission.id,
          name: updatedPermission.name,
          description: updatedPermission.description,
          createdAt: updatedPermission.createdAt.toISOString(),
          updatedAt: updatedPermission.updatedAt?.toISOString() || null,
        };

        return handleResponse(
          SuccessMessage.PERMISSION_UPDATED,
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
      params: "readPermissionModel",
      body: "updatePermissionModel",
    },
  );