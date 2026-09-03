import { and, eq, isNull } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { PermissionsDatabaseService } from "@/src/permissions/service/permissions-database"
import { permissions } from "@/db/schema/permission"
import { ServiceError } from "@/src/general/service-error"
import { verrou } from "@/utils/services/locks"

export const deletePermission = (id: string, userId: string) =>
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

        // DELETE PERMISSION
        yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`${userId}:delete-permission`)
                    .run(async () => {
                        await database
                            .update(permissions)
                            .set({ deletedAt: new Date() })
                            .where(eq(permissions.id, id))
                    }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return existingPermission
    })
