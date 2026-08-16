import { Effect } from "effect"
import { ulid } from "ulid"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"
import { PermissionServiceError } from "@/src/permissions/service/error"

export type CreatePermissionInput = {
    name: string
    description?: string
}

export const createPermission = (input: CreatePermissionInput) =>
    Effect.tryPromise({
        try: async () => {
            const permissionId = ulid()

            await db.insert(permissions).values({
                id: permissionId,
                name: input.name,
                description: input.description,
            })

            return {
                id: permissionId,
                name: input.name,
                description: input.description,
            }
        },
        catch: (error) => {
            console.error(error)
            return new PermissionServiceError(
                ErrorMessage.INTERNAL_SERVER_ERROR,
                ResponseErrorStatus.INTERNAL_SERVER_ERROR,
            )
        },
    })
