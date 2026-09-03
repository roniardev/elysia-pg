import { eq } from "drizzle-orm"
import { Effect } from "effect"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { userPermissions } from "@/db/schema/user-permissions"
import { ServiceError } from "@/src/general/service-error"
import { UserPermissionsDatabaseService } from "@/src/user-permissions/service/user-permissions-database"
import { verrou } from "@/utils/services/locks"
export const deleteUserPermission = (id: string, userId: string) =>
    Effect.gen(function* () {
        const database = yield* UserPermissionsDatabaseService

        const existingUserPermission = yield* Effect.tryPromise({
            try: () =>
                database.query.userPermissions.findFirst({
                    where: (fields, { eq }) => eq(fields.id, id),
                }),
            catch: () =>
                new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                ),
        })

        if (!existingUserPermission) {
            return yield* Effect.fail(
                new ServiceError(
                    ErrorMessage.USER_PERMISSION_NOT_FOUND,
                    ResponseErrorStatus.NOT_FOUND,
                ),
            )
        }

        yield* Effect.tryPromise({
            try: () =>
                verrou
                    .createLock(`${userId}:delete-user-permission`)
                    .run(async () => {
                        await database
                            .delete(userPermissions)
                            .where(eq(userPermissions.id, id))
                    }),
            catch: (error) => {
                console.error(error)
                return new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                )
            },
        })

        return { id: existingUserPermission.id }
    })
