import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type {
    PermissionId,
    UserId,
} from "@/src/general/domain/entity-id"
import type { PermissionUpdate } from "@/src/permissions/domain/entity/permission"
import { PermissionRepository } from "@/src/permissions/domain/repository/permission_repository"

export type UpdatePermissionParam = PermissionUpdate

export const updatePermissionUsecase = (
    id: PermissionId,
    param: UpdatePermissionParam,
    userId: UserId,
) =>
    Effect.gen(function* () {
        const repository = yield* PermissionRepository
        const existingPermission = yield* repository.getActivePermissionById(id)

        if (!existingPermission) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PERMISSION_NOT_FOUND),
            )
        }

        const permission = yield* repository.updatePermission(id, param, userId)

        if (!permission) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PERMISSION_NOT_FOUND),
            )
        }

        return {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            createdAt: permission.createdAt.toISOString(),
            updatedAt: permission.updatedAt?.toISOString() ?? null,
        }
    }).pipe(
        Effect.catchTag("PermissionRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.INTERNAL),
            ),
        ),
    )
