import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type { UserPermissionId } from "@/src/general/domain/entity-id"
import { toUserPermissionResponse } from "@/src/user-permissions/domain/entity/user_permission"
import { UserPermissionRepository } from "@/src/user-permissions/domain/repository/user_permission_repository"

export const getUserPermissionUsecase = (id: UserPermissionId) =>
    Effect.gen(function* () {
        const repository = yield* UserPermissionRepository
        const userPermission = yield* repository.getUserPermissionById(id)

        if (!userPermission) {
            return yield* Effect.fail(
                applicationError(
                    ApplicationErrorCode.USER_PERMISSION_NOT_FOUND,
                ),
            )
        }

        return toUserPermissionResponse(userPermission)
    }).pipe(
        Effect.catchTag("UserPermissionRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
