import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { UserPermissionServiceError } from "@/src/user-permissions/service/error"

export const readUserPermission = (id: string) =>
    Effect.gen(function* () {
        // READ USER PERMISSION
        const userPermission = yield* Effect.tryPromise({
            try: () =>
                db.query.userPermissions.findFirst({
                    where: (fields, { eq }) => eq(fields.id, id),
                    with: {
                        permission: true,
                    },
                }),
            catch: (error) => {
                console.error(error)
                return new UserPermissionServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!userPermission) {
            return yield* Effect.fail(
                new UserPermissionServiceError(
                    ErrorMessage.USER_PERMISSION_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        return {
            id: userPermission.id,
            userId: userPermission.userId,
            permissionId: userPermission.permissionId,
            revoked: userPermission.revoked,
            createdAt: userPermission.createdAt.toISOString(),
            updatedAt: userPermission.updatedAt?.toISOString() ?? null,
            permission: {
                id: userPermission.permission.id,
                name: userPermission.permission.name,
                description: userPermission.permission.description,
            },
        }
    })
