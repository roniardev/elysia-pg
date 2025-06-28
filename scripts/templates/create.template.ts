/**
 * Template for generating create usecase files
 */
export const createTemplate = (sourceName: string) => `import { Elysia } from "elysia"
import bearer from "@elysiajs/bearer"
import { ulid } from "ulid"

import { db } from "@/db"
import { ${sourceName.toLowerCase()} } from "@/db/schema"
import { ${sourceName}Permission } from "@/common/enum/permissions"
import { verifyPermission } from "@/src/general/usecase/verify-permission"
import { handleResponse } from "@/utils/handle-response"
import {
  ResponseErrorStatus,
  ResponseSuccessStatus,
} from "@/common/enum/response-status"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"

import { create${sourceName}Model } from "../data/${sourceName.toLowerCase()}.model"
import { jwtAccessSetup } from "@/src/auth/setup/auth"

export const create${sourceName} = new Elysia()
  .use(create${sourceName}Model)
  .use(jwtAccessSetup)
  .use(bearer())
  .post(
    "/${sourceName.toLowerCase()}",
    async ({ body, bearer, set, jwtAccess }) => {
      // CHECK VALID TOKEN
      if (!bearer) {
        return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
          set.status = ResponseErrorStatus.FORBIDDEN
        })
      }

      const validToken = await jwtAccess.verify(bearer)
      if (!validToken) {
        return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
          set.status = ResponseErrorStatus.FORBIDDEN
        })
      }

      // CHECK EXISTING USER
      const existingUser = await db.query.users.findFirst({
        where: (table, { eq, and, isNull }) => {
          return and(eq(table.id, validToken.id), isNull(table.deletedAt))
        },
      })

      if (!existingUser) {
        return handleResponse(ErrorMessage.INVALID_USER, () => {
          set.status = ResponseErrorStatus.BAD_REQUEST
        })
      }

      const { valid } = await verifyPermission(
        ${sourceName}Permission.CREATE_${sourceName.toUpperCase()},
        existingUser.id,
      )

      if (!valid) {
        return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
          set.status = ResponseErrorStatus.FORBIDDEN
        })
      }

      // CREATE ${sourceName.toUpperCase()}
      const ${sourceName.toLowerCase()}Id = ulid()

      try {
        await db.insert(${sourceName.toLowerCase()}).values({
          id: ${sourceName.toLowerCase()}Id,
          userId: existingUser.id,
          name: body.name,
          // Add other fields here based on your model
        })
      } catch (error) {
        console.error(error)
        return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
          set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR
        })
      }

      const response = {
        id: ${sourceName.toLowerCase()}Id,
        name: body.name,
        // Add other fields here based on your model
      }

      return handleResponse(
        SuccessMessage.${sourceName.toUpperCase()}_CREATED,
        () => {
          set.status = ResponseSuccessStatus.CREATED
        },
        response,
      )
    },
    {
      body: "create${sourceName}Model",
    },
  )
`