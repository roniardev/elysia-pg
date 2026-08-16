import { eq } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { userPermissions } from "@/db/schema/user-permissions"
import { ServiceError } from "@/src/general/service-error"
import { verrou } from "@/utils/services/locks"

export type UpdateUserPermissionInput = {
    revoked: boolean
}

export const updateUserPermission = (
    id: string,
    input: UpdateUserPermissionInput,
    userId: string,
) =>
    Effect.gen(function* () {
        // Check if user permission exists
        const existingUserPermission = yield* Effect.tryPromise({
            try: () =>
                db.query.userPermissions.findFirst({
                    where: (fields, { eq }) => eq(fields.id, id),
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingUserPermission) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_PERMISSION_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        // UPDATE USER PERMISSION
        const result = yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`${userId}:update-user-permission`)
                    .run(async () => {
                        const [updated] = await db
                            .update(userPermissions)
                            .set({
                                revoked: input.revoked,
                                updatedAt: new Date(),
                            })
                            .where(eq(userPermissions.id, id))
                            .returning()

                        return updated
                    }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        const didAcquire = result[0]
        const updatedUserPermission = result[1]

        if (!didAcquire || !updatedUserPermission) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_PERMISSION_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        return {
            id: updatedUserPermission.id,
            userId: updatedUserPermission.userId,
            permissionId: updatedUserPermission.permissionId,
            revoked: updatedUserPermission.revoked,
            createdAt: updatedUserPermission.createdAt.toISOString(),
            updatedAt: updatedUserPermission.updatedAt?.toISOString() ?? null,
        }
    })
