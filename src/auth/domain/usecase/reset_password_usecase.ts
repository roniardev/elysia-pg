import { Effect } from "effect"

import type { ResetPasswordParam } from "@/src/auth/domain/entity/auth"
import { AuthRepository } from "@/src/auth/domain/repository/auth_repository"
import { AuthTokens } from "@/src/auth/domain/repository/auth_token_service"
import { authError, internalAuthError } from "@/src/auth/domain/usecase/errors"
import { ApplicationErrorCode } from "@/src/general/domain/application_error"
import { PasswordHasher } from "@/src/general/service/password_hasher"

export const resetPasswordUsecase = (param: ResetPasswordParam) =>
    Effect.gen(function* () {
        const tokens = yield* AuthTokens
        const userId = yield* tokens.verify(param.token, "email").pipe(
            Effect.mapError(() =>
                authError(ApplicationErrorCode.EMAIL_TOKEN_INVALID_FORMAT),
            ),
        )
        const repository = yield* AuthRepository
        const user = yield* repository.getUserById(userId)

        if (!user) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.USER_NOT_FOUND),
            )
        }

        const storedToken = yield* repository.getPasswordResetToken(userId)

        if (!storedToken) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.EMAIL_TOKEN_NOT_FOUND),
            )
        }

        const hasher = yield* PasswordHasher
        const valid = yield* hasher.verify(param.token, storedToken.hashedToken)

        if (!valid || storedToken.revoked) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.EMAIL_TOKEN_REJECTED),
            )
        }

        if (storedToken.expiresAt < new Date()) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.EMAIL_TOKEN_EXPIRED),
            )
        }

        if (param.password !== param.confirmPassword) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.PASSWORDS_DO_NOT_MATCH),
            )
        }

        const hashedPassword = yield* hasher.hash(param.password)
        yield* repository.resetPassword(userId, hashedPassword)
        return null
    }).pipe(
        Effect.catchTags({
            AuthRepositoryError: internalAuthError,
            PasswordHasherError: internalAuthError,
        }),
    )
