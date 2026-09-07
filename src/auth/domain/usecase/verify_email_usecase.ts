import { Effect } from "effect"

import type { VerifyEmailParam } from "@/src/auth/domain/entity/auth"
import { AuthRepository } from "@/src/auth/domain/repository/auth_repository"
import { AuthTokens } from "@/src/auth/domain/repository/auth_token_service"
import { authError, internalAuthError } from "@/src/auth/domain/usecase/errors"
import { ApplicationErrorCode } from "@/src/general/domain/application-error"
import { PasswordHasher } from "@/src/general/service/password_hasher"

export const verifyEmailUsecase = (param: VerifyEmailParam) =>
    Effect.gen(function* () {
        const tokens = yield* AuthTokens
        const userId = yield* tokens.verify(param.token, "email").pipe(
            Effect.mapError(() =>
                authError(ApplicationErrorCode.EMAIL_TOKEN_REJECTED),
            ),
        )
        const repository = yield* AuthRepository
        const user = yield* repository.getUserById(userId)

        if (user?.emailVerified) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.EMAIL_ALREADY_VERIFIED),
            )
        }

        const storedToken = yield* repository.getEmailVerificationToken(userId)
        const hasher = yield* PasswordHasher
        const valid = yield* hasher.verify(
            param.token,
            storedToken?.hashedToken || "",
        )

        if (!storedToken || !valid) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.EMAIL_TOKEN_REJECTED),
            )
        }

        if (storedToken.expiresAt < new Date()) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.EMAIL_TOKEN_EXPIRED),
            )
        }

        yield* repository.verifyEmail(storedToken.id, userId)
        return null
    }).pipe(
        Effect.catchTags({
            AuthRepositoryError: internalAuthError,
            PasswordHasherError: internalAuthError,
        }),
    )
