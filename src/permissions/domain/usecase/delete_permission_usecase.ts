import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type {
    PermissionId,
    UserId,
} from "@/src/general/domain/entity-id"
import { PermissionRepository } from "@/src/permissions/domain/repository/permission_repository"

export const deletePermissionUsecase = (id: PermissionId, userId: UserId) =>
    Effect.gen(function* () {
        const repository = yield* PermissionRepository
        const permission = yield* repository.getActivePermissionById(id)

        if (!permission) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PERMISSION_NOT_FOUND),
            )
        }

        yield* repository.deletePermission(id, userId)

        return permission
    }).pipe(
        Effect.catchTag("PermissionRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.INTERNAL),
            ),
        ),
    )
