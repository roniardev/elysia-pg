/**
 * Template for generating read-all usecase files
 */
export const readAllTemplate = (sourceName: string) => `import { Elysia } from "elysia"
import bearer from "@elysiajs/bearer"

import { db } from "@/db"
import { jwtAccessSetup } from "@/src/auth/setup/auth"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { ${sourceName}Permission } from "@/common/enum/permissions"
import { handleResponse } from "@/utils/handle-response"
import {
  ResponseErrorStatus,
  ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"

import { readAll${sourceName}Model } from "../data/${sourceName.toLowerCase()}.model"
import { getScope } from "@/src/general/usecase/get-scope"
import { Scope } from "@/common/enum/scopes"

export const readAll${sourceName} = new Elysia()
  .use(readAll${sourceName}Model)
  .use(jwtAccessSetup)
  .use(bearer())
  .get(
    "/${sourceName.toLowerCase()}",
    async ({ query, bearer, set, jwtAccess }) => {
      // CHECK VALID TOKEN
      const validToken = await jwtAccess.verify(bearer)

      if (!validToken) {
        return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
          set.status = ResponseErrorStatus.FORBIDDEN
        })
      }

      // CHECK EXISTING READ ${sourceName.toUpperCase()} PERMISSION
      const { valid, permission } = await verifyPermission(
        ${sourceName}Permission.READ_${sourceName.toUpperCase()},
        validToken.id,
      )

      if (!valid || !permission) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN
        })
      }

      const scope = await getScope(permission)

      // READ ALL ${sourceName.toUpperCase()}
      const page = Number(query.page) || 1
      const limit = Number(query.limit) || 10
      const offset = (page - 1) * limit

      const ${sourceName.toLowerCase()}List = await db.query.${sourceName.toLowerCase()}.findMany({
        where: (table, { eq, and }) => {
          if (scope === Scope.PERSONAL) {
            return eq(table.userId, validToken.id)
          }

          return undefined
        },
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      })

      const total = await db.query.${sourceName.toLowerCase()}.count({
        where: (table, { eq }) => {
          if (scope === Scope.PERSONAL) {
            return eq(table.userId, validToken.id)
          }

          return undefined
        },
      })

      const totalPages = Math.ceil(total / limit)

      return handleResponse(
        SuccessMessage.${sourceName.toUpperCase()}_READ,
        () => {
          set.status = ResponseSuccessStatus.OK
        },
        {
          data: ${sourceName.toLowerCase()}List,
          meta: {
            page,
            limit,
            total,
            totalPages,
          },
        },
      )
    },
    {
      query: "readAll${sourceName}Model",
    },
  )
`