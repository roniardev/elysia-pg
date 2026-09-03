import { Effect } from "effect"
import { ulid } from "ulid"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { permissions } from "@/db/schema/permission"
import { ServiceError } from "@/src/general/service-error"
import { PermissionsDatabaseService } from "@/src/permissions/service/permissions-database"

export type CreatePermissionInput = {
    name: string
    description?: string
}

export const createPermission = (input: CreatePermissionInput) =>
    Effect.gen(function* () {
        const database = yield* PermissionsDatabaseService

        return yield* Effect.tryPromise({
            try: async () => {
                const permissionId = ulid()

                await database.insert(permissions).values({
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
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })
    })
