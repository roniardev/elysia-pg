import { Effect } from "effect"

import { verifyEmailTemplate } from "@/common/email-templates/verify-email"
import RegexPattern from "@/common/regex-pattern"
import type { RegisterParam } from "@/src/auth/domain/entity/auth"
import { AuthRepository } from "@/src/auth/domain/repository/auth_repository"
import { AuthTokens } from "@/src/auth/domain/repository/auth_token_service"
import { authError, internalAuthError } from "@/src/auth/domain/usecase/errors"
import { ApplicationErrorCode } from "@/src/general/domain/application_error"
import {
    AuthTokenId,
    UserId,
} from "@/src/general/domain/entity_id"
import { EmailSender } from "@/src/general/service/email_sender"
import { FrontendConfig } from "@/src/general/service/frontend_config"
import { IdGenerator } from "@/src/general/service/id_generator"
import { PasswordHasher } from "@/src/general/service/password_hasher"

export const registerUsecase = (param: RegisterParam) =>
    Effect.gen(function* () {
        if (!param.email.match(RegexPattern.EMAIL)) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.INVALID_CREDENTIAL_FORMAT),
            )
        }

        if (param.password !== param.confirmPassword) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.PASSWORDS_DO_NOT_MATCH),
            )
        }

        const repository = yield* AuthRepository
        const existing = yield* repository.getUserByEmail(param.email)

        if (existing) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.USER_ALREADY_EXISTS),
            )
        }

        const ids = yield* IdGenerator
        const hasher = yield* PasswordHasher
        const tokens = yield* AuthTokens
        const sender = yield* EmailSender
        const frontend = yield* FrontendConfig
        const userId = UserId(yield* ids.generate)
        const hashedPassword = yield* hasher.hash(param.password)
        const created = yield* repository.createUser({
            id: userId,
            email: param.email,
            hashedPassword,
        })

        if (!created) {
            return yield* Effect.fail(
                authError(ApplicationErrorCode.USER_ALREADY_EXISTS),
            )
        }

        const emailToken = yield* tokens.sign(userId, "registrationEmail")
        const hashedToken = yield* hasher.hash(emailToken)
        yield* repository.createEmailVerificationToken({
            id: AuthTokenId(yield* ids.generate),
            email: param.email,
            userId,
            hashedToken,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        })
        yield* sender.send({
            to: param.email,
            subject: "Verify your email",
            html: verifyEmailTemplate(emailToken, frontend.url),
        })

        return null
    }).pipe(
        Effect.catchTags({
            AuthRepositoryError: internalAuthError,
            AuthTokenError: internalAuthError,
            EmailSenderError: internalAuthError,
            PasswordHasherError: internalAuthError,
        }),
    )
