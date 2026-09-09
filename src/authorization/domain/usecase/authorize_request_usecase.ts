import { Effect } from "effect"

import type {
    AuthorizationRequest,
} from "@/src/authorization/domain/entity/authorization"
import { AuthorizationRepository } from "@/src/authorization/domain/repository/authorization_repository"
import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application_error"

export const authorizeRequestUsecase = (request: AuthorizationRequest) =>
    Effect.gen(function* () {
        const repository = yield* AuthorizationRepository
        const validSession = yield* repository.verifyAuthorizationSession(
            request.userId,
            request.accessToken,
            request.tokenExpiresAt,
        )

        if (!validSession) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.UNAUTHORIZED),
            )
        }

        const activeUser = yield* repository.getActiveAuthorizationUser(request.userId)

        if (!activeUser) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.INVALID_USER),
            )
        }

        const grant = yield* repository.getPermissionGrant(
            request.userId,
            request.permission,
        )

        if (!grant) {
            return yield* Effect.fail(
                applicationError(ApplicationErrorCode.UNAUTHORIZED_PERMISSION),
            )
        }

        return {
            userId: request.userId,
            scope: grant.scope,
        }
    }).pipe(
        Effect.catchTag("AuthorizationRepositoryError", () =>
            Effect.fail(applicationError(ApplicationErrorCode.INTERNAL)),
        ),
    )
