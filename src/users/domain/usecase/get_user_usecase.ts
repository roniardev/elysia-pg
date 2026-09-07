import { Effect } from "effect"

import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import type { UserId } from "@/src/general/domain/entity-id"
import { UserRepository } from "@/src/users/domain/repository/user_repository"

const requireUser = <User>(user: User | null) => {
    if (user) {
        return Effect.succeed(user)
    }

    return Effect.fail(
        applicationError(ApplicationErrorCode.USER_NOT_FOUND),
    )
}

export const getUserUsecase = (id: UserId) =>
    Effect.gen(function* () {
        const repository = yield* UserRepository
        const user = yield* repository.getActiveUserById(id)
        const existingUser = yield* requireUser(user)

        return {
            id: existingUser.id,
            email: existingUser.email,
            emailVerified: existingUser.emailVerified,
            permissions: existingUser.permissions,
        }
    }).pipe(
        Effect.catchTag("UserRepositoryError", () =>
            Effect.fail(
                applicationError(ApplicationErrorCode.INTERNAL),
            ),
        ),
    )
