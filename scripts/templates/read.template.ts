/**
 * Template for generating read usecase files
 */
export const readTemplate = (sourceName: string) => `import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { ${sourceName}Permission } from "@/common/enum/permissions";
import { handleResponse } from "@/utils/handle-response";
import {
  ResponseErrorStatus,
  ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";

import { read${sourceName}Model } from "../data/${sourceName.toLowerCase()}.model";
import { getScope } from "@/src/general/usecase/get-scope";
import { Scope } from "@/common/enum/scopes";

export const read${sourceName} = new Elysia()
  .use(read${sourceName}Model)
  .use(jwtAccessSetup)
  .use(bearer())
  .get(
    "/${sourceName.toLowerCase()}/:id",
    async ({ params, bearer, set, jwtAccess }) => {
      // CHECK VALID TOKEN
      const validToken = await jwtAccess.verify(bearer);

      if (!validToken) {
        return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      // CHECK EXISTING READ ${sourceName.toUpperCase()} PERMISSION
      const { valid, permission } = await verifyPermission(
        ${sourceName}Permission.READ_${sourceName.toUpperCase()},
        validToken.id,
      );

      if (!valid || !permission) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN;
        });
      }

      const scope = await getScope(permission);

      // READ ${sourceName.toUpperCase()}
      const ${sourceName.toLowerCase()} = await db.query.${sourceName.toLowerCase()}.findFirst({
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

      if (!${sourceName.toLowerCase()}) {
        return handleResponse(ErrorMessage.${sourceName.toUpperCase()}_NOT_FOUND, () => {
          set.status = ResponseErrorStatus.BAD_REQUEST;
        });
      }

      return handleResponse(
        SuccessMessage.${sourceName.toUpperCase()}_READ,
        () => {
          set.status = ResponseSuccessStatus.OK;
        },
        ${sourceName.toLowerCase()},
      );
    },
    {
      params: "read${sourceName}Model",
    },
  );
`; 