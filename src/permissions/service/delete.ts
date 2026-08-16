import { and, eq, isNull } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"
import { PermissionServiceError } from "@/src/permissions/service/error"
import { verrou } from "@/utils/services/locks"

export const deletePermission = (id: string, userId: string) =>
    Effect.gen(function* () {
        // CHECK IF PERMISSION EXISTS
        const existingPermission = yield* Effect.tryPromise({
            try: () =>
                db.query.permissions.findFirst({
                    where: (table, { eq, and, isNull }) => {
                        return and(eq(table.id, id), isNull(table.deletedAt))
                    },
                }),
            catch: (error) => {
                console.error(error)
                return new PermissionServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        if (!existingPermission) {
            return yield* Effect.fail(
                new PermissionServiceError(
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
                        await db
                            .update(permissions)
                            .set({ deletedAt: new Date() })
                            .where(eq(permissions.id, id))
                    }),
            catch: (error) => {
                console.error(error)
                return new PermissionServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return existingPermission
    })
