/**
 * Template for generating update usecase files
 */
export const updateTemplate = (sourceName: string) => `import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { ${sourceName.toLowerCase()} } from "@/db/schema";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { ${sourceName}Permission } from "@/common/enum/permissions";
import { handleResponse } from "@/utils/handle-response";
import {
  ResponseErrorStatus,
  ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";

import { update${sourceName}Model } from "../data/${sourceName.toLowerCase()}.model";
import { getScope } from "@/src/general/usecase/get-scope";
import { Scope } from "@/common/enum/scopes";

export const update${sourceName} = new Elysia()
  .use(update${sourceName}Model)
  .use(jwtAccessSetup)
  .use(bearer())
  .put(
    "/${sourceName.toLowerCase()}/:id",
    async ({ params, body, bearer, set, jwtAccess }) => {
      // CHECK VALID TOKEN
      const validToken = await jwtAccess.verify(bearer);

      if (!validToken) {
        return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // CHECK EXISTING UPDATE ${sourceName.toUpperCase()} PERMISSION
      const { valid, permission } = await verifyPermission(
        ${sourceName}Permission.UPDATE_${sourceName.toUpperCase()},
        validToken.id,
      );

      if (!valid || !permission) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      const scope = await getScope(permission);

      // CHECK EXISTING ${sourceName.toUpperCase()}
      const existing${sourceName} = await db.query.${sourceName.toLowerCase()}.findFirst({
        where: (table, { eq, and }) => {
          if (scope === Scope.PERSONAL) {
            return and(
              eq(table.id, params.id),
              eq(table.userId, validToken.id),
            );
          }

          return eq(table.id, params.id);
        },
      });

      if (!existing${sourceName}) {
        return handleResponse(ErrorMessage.${sourceName.toUpperCase()}_NOT_FOUND, () => {
          set.status = ResponseErrorStatus.BAD_REQUEST;
        });
      }

      // UPDATE ${sourceName.toUpperCase()}
      try {
        await db
          .update(${sourceName.toLowerCase()})
          .set({
            name: body.name ?? existing${sourceName}.name,
            // Add other fields to update based on your model
            updatedAt: new Date(),
          })
          .where(({ id }) => id.equals(params.id));
      } catch (error) {
        console.error(error);
        return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
          set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
        });
      }

      const updated${sourceName} = await db.query.${sourceName.toLowerCase()}.findFirst({
        where: (table, { eq }) => {
          return eq(table.id, params.id);
        },
      });

      if (!updated${sourceName}) {
        return handleResponse(ErrorMessage.FAILED_TO_UPDATE_${sourceName.toUpperCase()}, () => {
          set.status = ResponseErrorStatus.BAD_REQUEST;
        });
      }

      return handleResponse(
        SuccessMessage.${sourceName.toUpperCase()}_UPDATED,
        () => {
          set.status = ResponseSuccessStatus.OK;
        },
        updated${sourceName},
      );
    },
    {
      params: "update${sourceName}Model",
      body: "update${sourceName}Model",
    },
  );
`; 