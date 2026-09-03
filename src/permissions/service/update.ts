import { and, eq, isNull } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { PermissionsDatabaseService } from "@/src/permissions/service/permissions-database"
import { permissions } from "@/db/schema/permission"
import { ServiceError } from "@/src/general/service-error"
import { verrou } from "@/utils/services/locks"

export type UpdatePermissionInput = {
    name?: string
    description?: string
}

export const updatePermission = (
    id: string,
    input: UpdatePermissionInput,
    userId: string,
) =>
    Effect.gen(function* () {
        const database = yield* PermissionsDatabaseService
        // CHECK IF PERMISSION EXISTS
        const existingPermission = yield* Effect.tryPromise({
            try: () =>
                database.query.permissions.findFirst({
                    where: (table, { eq, and, isNull }) =>
                        and(eq(table.id, id), isNull(table.deletedAt)),
                }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingPermission) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.PERMISSION_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        // UPDATE PERMISSION
        const result = yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`${userId}:update-permission`)
                    .run(async () => {
                        await database
                            .update(permissions)
                            .set({
                                name: input.name || existingPermission.name,
                                description:
                                    input.description ??
                                    existingPermission.description,
                                updatedAt: new Date(),
                            })
                            .where(eq(permissions.id, id))

                        const updatedPermission =
                            await database.query.permissions.findFirst({
                                where: (table, { eq }) => eq(table.id, id),
                            })

                        if (!updatedPermission) {
                            return null
                        }

                        return {
                            id: updatedPermission.id,
                            name: updatedPermission.name,
                            description: updatedPermission.description,
                            createdAt:
                                updatedPermission.createdAt.toISOString(),
                            updatedAt:
                                updatedPermission.updatedAt?.toISOString() ||
                                null,
                        }
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
        const updatedPermission = result[1]

        if (!didAcquire || !updatedPermission) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.PERMISSION_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        return updatedPermission
    })
