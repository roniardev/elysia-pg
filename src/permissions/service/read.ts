import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { PermissionServiceError } from "@/src/permissions/service/error"

export const readPermission = (id: string) =>
    Effect.gen(function* () {
        const permission = yield* Effect.tryPromise({
            try: () =>
                db.query.permissions.findFirst({
                    where: (table, { eq }) => eq(table.id, id),
                }),
            catch: (error) => {
                console.error(error)
                return new PermissionServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!permission) {
            return yield* Effect.fail(
                new PermissionServiceError(
                    ErrorMessage.PERMISSION_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        return [
            {
                id: permission.id,
                name: permission.name,
                description: permission.description,
                createdAt: permission.createdAt.toISOString(),
                updatedAt: permission.updatedAt?.toISOString() || null,
            },
        ]
    })
