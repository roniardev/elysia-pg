import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application_error"
import type {
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity_id"
import { UserPermissionRepository } from "@/src/user-permissions/domain/repository/user_permission_repository"

export const deleteUserPermissionUsecase = (
    id: UserPermissionId,
    userId: UserId,
) =>
    Effect.gen(function* () {
        const repository = yield* UserPermissionRepository
        const existing = yield* repository.getUserPermissionById(id)

        if (!existing) {
            return yield* Effect.fail(
                applicationError(
                    ApplicationErrorCode.USER_PERMISSION_NOT_FOUND,
                ),
            )
        }

        yield* repository.deleteUserPermission(id, userId)
        return { id: existing.id }
    }).pipe(
        Effect.catchTag("UserPermissionRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
