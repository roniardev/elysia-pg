import { and, eq } from "drizzle-orm"
import { Effect } from "effect"
import { ulid } from "ulid"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { userPermissions } from "@/db/schema/user-permissions"
import { UserPermissionServiceError } from "@/src/user-permissions/service/error"

export type CreateUserPermissionInput = {
    userId: string
    permissionId: string
}

export const createUserPermission = (input: CreateUserPermissionInput) =>
    Effect.gen(function* () {
        // Check if permission already exists and not revoked
        const existingPermission = yield* Effect.tryPromise({
            try: () =>
                db.query.userPermissions.findFirst({
                    where: (fields, { eq, and }) =>
                        and(
                            eq(fields.userId, input.userId),
                            eq(fields.permissionId, input.permissionId),
                            eq(fields.revoked, false),
                        ),
                }),
            catch: (error) => {
                console.error(error)
                return new UserPermissionServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (existingPermission) {
            return yield* Effect.fail(
                new UserPermissionServiceError(
                    ErrorMessage.PERMISSION_ALREADY_ASSIGNED,
                    ResponseErrorStatus.BAD_REQUEST,
                ),
            )
        }

        // CREATE USER PERMISSION
        const userPermissionId = ulid()

        yield* Effect.tryPromise({
            try: () =>
                db.insert(userPermissions).values({
                    id: userPermissionId,
                    userId: input.userId,
                    permissionId: input.permissionId,
                }),
            catch: (error) => {
                console.error(error)
                return new UserPermissionServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return {
            id: userPermissionId,
            userId: input.userId,
            permissionId: input.permissionId,
            revoked: false,
        }
    })
