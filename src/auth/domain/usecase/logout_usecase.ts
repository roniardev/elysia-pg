import { Effect } from "effect"

import { AuthSessionRepository } from "@/src/auth/domain/repository/auth_session_repository"
import { AuthTokens } from "@/src/auth/domain/repository/auth_token_service"
import { authError, internalAuthError } from "@/src/auth/domain/usecase/errors"
import { ApplicationErrorCode } from "@/src/general/domain/application-error"

export const logoutUsecase = (bearerToken: string | undefined) =>
    Effect.gen(function* () {
        const tokens = yield* AuthTokens
        const userId = yield* tokens.verify(bearerToken || "", "access").pipe(
            Effect.mapError(() =>
                authError(ApplicationErrorCode.UNAUTHORIZED),
            ),
        )
        const sessions = yield* AuthSessionRepository
        const accessToken = yield* sessions.getAccess(userId)
        const refreshToken = yield* sessions.getRefresh(userId)

        if (!accessToken || !refreshToken || accessToken !== bearerToken) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.UNAUTHORIZED),
            )
        }

        const deleted = yield* sessions.delete(userId)

        if (!deleted) {
            return yield* internalAuthError()
        }

        return null
    }).pipe(
        Effect.catchTag("AuthSessionError", internalAuthError),
    )
