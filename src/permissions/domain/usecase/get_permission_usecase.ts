import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application_error"
import type { PermissionId } from "@/src/general/domain/entity_id"
import { PermissionRepository } from "@/src/permissions/domain/repository/permission_repository"

export const getPermissionUsecase = (id: PermissionId) =>
    Effect.gen(function* () {
        const repository = yield* PermissionRepository
        const permission = yield* repository.getActivePermissionById(id)

        if (!permission) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.PERMISSION_NOT_FOUND),
            )
        }

        return [
            {
                id: permission.id,
                name: permission.name,
                description: permission.description,
                createdAt: permission.createdAt.toISOString(),
                updatedAt: permission.updatedAt?.toISOString() ?? null,
            },
        ]
    }).pipe(
        Effect.catchTag("PermissionRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.INTERNAL),
            ),
        ),
    )
