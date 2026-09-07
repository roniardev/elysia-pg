import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type { UserId } from "@/src/general/domain/entity-id"
import { UserRepository } from "@/src/users/domain/repository/user_repository"

export const deleteUserUsecase = (id: UserId) =>
    Effect.gen(function* () {
        const repository = yield* UserRepository
        const existingUser = yield* repository.getActiveUserById(id)

        if (!existingUser) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.USER_NOT_FOUND),
            )
        }

        yield* repository.deleteUser(existingUser.id)

        return { id: existingUser.id }
    }).pipe(
        Effect.catchTag("UserRepositoryError", (error) => {
            let code = ApplicationErrorCode.INTERNAL

            if (error.operation === "deleteUser") {
                code = ApplicationErrorCode.FAILED_TO_DELETE_USER
            }

            return Effect.fail(applicationError(code))
        }),
    )
