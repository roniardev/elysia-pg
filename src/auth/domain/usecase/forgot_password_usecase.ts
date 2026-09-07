import { Effect } from "effect"

import RegexPattern from "@/common/regex-pattern"
import type { ForgotPasswordParam } from "@/src/auth/domain/entity/auth"
import { AuthNotification } from "@/src/auth/domain/repository/auth_notification_service"
import { AuthRepository } from "@/src/auth/domain/repository/auth_repository"
import { AuthTokens } from "@/src/auth/domain/repository/auth_token_service"
import { authError, internalAuthError } from "@/src/auth/domain/usecase/errors"
import { ApplicationErrorCode } from "@/src/general/domain/application-error"
import { AuthTokenId } from "@/src/general/domain/entity-id"
import { IdGenerator } from "@/src/general/service/id_generator"
import { PasswordHasher } from "@/src/general/service/password_hasher"

export const forgotPasswordUsecase = (param: ForgotPasswordParam) =>
    Effect.gen(function* () {
        if (!param.email.match(RegexPattern.EMAIL)) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.INVALID_CREDENTIAL_FORMAT),
            )
        }

        const repository = yield* AuthRepository
        const user = yield* repository.getUserByEmail(param.email, true)

        if (!user) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.USER_NOT_FOUND),
            )
        }

        const tokens = yield* AuthTokens
        const hasher = yield* PasswordHasher
        const ids = yield* IdGenerator
        const token = yield* tokens.sign(user.id, "email")
        const hashedToken = yield* hasher.hash(token)
        yield* repository.createPasswordResetToken({
            id: AuthTokenId(yield* ids.generate),
            userId: user.id,
            hashedToken,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        }, `${param.email}:forgot-password:${user.id}:generateToken`)
        const notification = yield* AuthNotification
        yield* notification.sendPasswordReset(param.email, user.id, token)

        return null
    }).pipe(
        Effect.catchTags({
            AuthRepositoryError: internalAuthError,
            AuthNotificationError: internalAuthError,
            AuthTokenError: internalAuthError,
            PasswordHasherError: internalAuthError,
        }),
    )
