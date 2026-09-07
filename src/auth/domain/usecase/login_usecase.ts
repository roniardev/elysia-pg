import { Effect } from "effect"

import RegexPattern from "@/common/regex-pattern"
import type { LoginParam } from "@/src/auth/domain/entity/auth"
import { AuthRepository } from "@/src/auth/domain/repository/auth_repository"
import { AuthSessionRepository } from "@/src/auth/domain/repository/auth_session_repository"
import { AuthTokens } from "@/src/auth/domain/repository/auth_token_service"
import { authError, internalAuthError } from "@/src/auth/domain/usecase/errors"
import { ApplicationErrorCode } from "@/src/general/domain/application-error"
import { PasswordHasher } from "@/src/general/service/password_hasher"

const invalidCredentials = () =>
    authError(ApplicationErrorCode.INVALID_CREDENTIALS)

export const loginUsecase = (param: LoginParam) =>
    Effect.gen(function* () {
        if (!param.email.match(RegexPattern.EMAIL)) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.INVALID_CREDENTIAL_FORMAT),
            )
        }

        const repository = yield* AuthRepository
        const user = yield* repository.getUserByEmail(param.email)

        if (!user) {
            return yield* Effect.fail(invalidCredentials())
        }

        if (!user.emailVerified) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.EMAIL_NOT_VERIFIED),
            )
        }

        const hasher = yield* PasswordHasher
        const validPassword = yield* hasher.verify(
            param.password,
            user.hashedPassword || "",
        )

        if (!validPassword) {
            return yield* Effect.fail(invalidCredentials())
        }

        const sessions = yield* AuthSessionRepository
        const existing = yield* sessions.getRefresh(user.id)

        if (existing) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.SESSION_ALREADY_EXISTS),
            )
        }

        const tokens = yield* AuthTokens
        const refreshToken = yield* tokens.sign(user.id, "refresh")
        const accessToken = yield* tokens.sign(user.id, "access")
        const session = { accessToken, refreshToken }
        const stored = yield* sessions.store(user.id, session, `${user.id}:login`)

        if (!stored) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.SESSION_ALREADY_EXISTS),
            )
        }

        return session
    }).pipe(
        Effect.catchTags({
            AuthRepositoryError: internalAuthError,
            AuthSessionError: internalAuthError,
            AuthTokenError: internalAuthError,
            PasswordHasherError: internalAuthError,
        }),
    )
