import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application_error"
import { PermissionId } from "@/src/general/domain/entity_id"
import { IdGenerator } from "@/src/general/service/id_generator"
import { PermissionRepository } from "@/src/permissions/domain/repository/permission_repository"

export type CreatePermissionParam = {
    name: string
    description?: string
}

export const createPermissionUsecase = (param: CreatePermissionParam) =>
    Effect.gen(function* () {
        const idGenerator = yield* IdGenerator
        const repository = yield* PermissionRepository
        const id = PermissionId(yield* idGenerator.generate)

        yield* repository.createPermission({ id, ...param })

        return { id, ...param }
    }).pipe(
        Effect.catchTag("PermissionRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.INTERNAL),
            ),
        ),
    )
