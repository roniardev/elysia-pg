import { Effect } from "effect"

import { AuthRepository } from "@/src/auth/domain/repository/auth_repository"
import { AuthSessionRepository } from "@/src/auth/domain/repository/auth_session_repository"
import { AuthTokens } from "@/src/auth/domain/repository/auth_token_service"
import { authError, internalAuthError } from "@/src/auth/domain/usecase/errors"
import { ApplicationErrorCode } from "@/src/general/domain/application_error"

const unauthorized = () => authError(ApplicationErrorCode.UNAUTHORIZED)

export const regenerateAccessTokenUsecase = (
    bearerToken: string | undefined,
) =>
    Effect.gen(function* () {
        const tokens = yield* AuthTokens
        const userId = yield* tokens.verify(bearerToken || "", "refresh").pipe(
            Effect.mapError(unauthorized),
        )
        const sessions = yield* AuthSessionRepository
        const existing = yield* sessions.getRefresh(userId)

        if (!existing || existing !== bearerToken) {
            return yield* Effect.fail(unauthorized())
        }

        const repository = yield* AuthRepository
        const user = yield* repository.getUserById(userId)

        if (!user) {
            return yield* Effect.fail(unauthorized())
        }

        const refreshToken = yield* tokens.sign(userId, "refresh")
        const accessToken = yield* tokens.sign(userId, "access")
        const session = { accessToken, refreshToken }
        const stored = yield* sessions.store(
            userId,
            session,
            `${userId}:regenerate-access-token`,
        )

        if (!stored) {
            return yield* internalAuthError()
        }

        return session
    }).pipe(
        Effect.catchTags({
            AuthRepositoryError: internalAuthError,
            AuthSessionError: internalAuthError,
            AuthTokenError: internalAuthError,
        }),
    )
