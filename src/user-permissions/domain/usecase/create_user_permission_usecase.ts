import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import { UserPermissionId } from "@/src/general/domain/entity-id"
import { IdGenerator } from "@/src/general/service/id_generator"
import type { CreateUserPermissionParam } from "@/src/user-permissions/domain/entity/user_permission"
import { UserPermissionRepository } from "@/src/user-permissions/domain/repository/user_permission_repository"

export const createUserPermissionUsecase = (
    param: CreateUserPermissionParam,
) =>
    Effect.gen(function* () {
        const idGenerator = yield* IdGenerator
        const repository = yield* UserPermissionRepository
        const existing = yield* repository.getActiveUserPermissionAssignment(param)

        if (existing) {
            return yield* Effect.fail(
                applicationError(
                    ApplicationErrorCode.PERMISSION_ALREADY_ASSIGNED,
                ),
            )
        }

        const id = UserPermissionId(yield* idGenerator.generate)
        const created = yield* repository.createUserPermission({ ...param, id })

        return {
            id: created.id,
            userId: created.userId,
            permissionId: created.permissionId,
            revoked: created.revoked,
        }
    }).pipe(
        Effect.catchTag("UserPermissionRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
