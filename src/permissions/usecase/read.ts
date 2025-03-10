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

import { readPermissionModel } from "../data/permissions.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const readPermission = new Elysia()
  .use(readPermissionModel)
  .use(jwtAccessSetup)
  .use(bearer())
  .get(
    "/permission/:id",
    async ({ params, bearer, set, jwtAccess }) => {
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

      // Verify if user has permission to read permissions
      const { valid } = await verifyPermission(
        ManagePermission.READ_PERMISSION,
        existingUser.id,
      );

      if (!valid) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // READ PERMISSION
      try {
        const permission = await db.query.permissions.findFirst({
          where: (table, { eq, and, isNull }) => {
            return and(eq(table.id, params.id), isNull(table.deletedAt));
          },
        });

        if (!permission) {
          return handleResponse(ErrorMessage.PERMISSION_NOT_FOUND, () => {
            set.status = ResponseErrorStatus.NOT_FOUND;
          });
        }

        const responseData = [
          {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            createdAt: permission.createdAt.toISOString(),
            updatedAt: permission.updatedAt?.toISOString() || null,
          },
        ];

        return handleResponse(
          SuccessMessage.PERMISSION_READ,
          () => {
            set.status = ResponseSuccessStatus.OK;
          },
          {
            data: responseData
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
      params: "readPermissionModel",
    },
  ); 