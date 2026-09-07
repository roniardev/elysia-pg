import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type {
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity-id"
import type { UpdateUserPermissionParam } from "@/src/user-permissions/domain/entity/user_permission"
import { UserPermissionRepository } from "@/src/user-permissions/domain/repository/user_permission_repository"

const notFound = () =>
    applicationError(ApplicationErrorCode.USER_PERMISSION_NOT_FOUND)

export const updateUserPermissionUsecase = (
    id: UserPermissionId,
    param: UpdateUserPermissionParam,
    userId: UserId,
) =>
    Effect.gen(function* () {
        const repository = yield* UserPermissionRepository
        const existing = yield* repository.getUserPermissionById(id)

        if (!existing) {
            return yield* Effect.fail(notFound())
        }

        const updated = yield* repository.updateUserPermission(id, param, userId)

        if (!updated) {
            return yield* Effect.fail(notFound())
        }

        return {
            id: updated.id,
            userId: updated.userId,
            permissionId: updated.permissionId,
            revoked: updated.revoked,
            createdAt: updated.createdAt.toISOString(),
            updatedAt: updated.updatedAt?.toISOString() ?? null,
        }
    }).pipe(
        Effect.catchTag("UserPermissionRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
