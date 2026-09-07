import { Clock, Effect } from "effect"

import { verifyEmailTemplate } from "@/common/email-templates/verify-email"
import {
    applicationError,
    ApplicationErrorCode,
} from "@/src/general/domain/application-error"
import {
    AuthTokenId,
    PermissionId,
    UserId,
    UserPermissionId,
    type PermissionId as PermissionIdType,
} from "@/src/general/domain/entity-id"
import { EmailSender } from "@/src/general/service/email_sender"
import { EmailTokenSigner } from "@/src/general/service/email_token_signer"
import { FrontendConfig } from "@/src/general/service/frontend_config"
import { IdGenerator } from "@/src/general/service/id_generator"
import { PasswordHasher } from "@/src/general/service/password_hasher"
import type { CreateUserRecord } from "@/src/users/domain/entity/user"
import { UserRepository } from "@/src/users/domain/repository/user_repository"

export type CreateUserParam = {
    email: string
    password: string
    emailVerified?: boolean
    permissions?: PermissionIdType[]
}

const requireAvailableEmail = (existingUser: unknown) => {
    if (!existingUser) {
        return Effect.void
    }

    return Effect.fail(
        applicationError(ApplicationErrorCode.USER_ALREADY_EXISTS),
    )
}

export const createUserUsecase = (param: CreateUserParam) =>
    Effect.gen(function* () {
        const emailSender = yield* EmailSender
        const frontendConfig = yield* FrontendConfig
        const idGenerator = yield* IdGenerator
        const passwordHasher = yield* PasswordHasher
        const repository = yield* UserRepository
        const tokenSigner = yield* EmailTokenSigner

        const existingUser = yield* repository.getActiveUserByEmail(param.email)
        yield* requireAvailableEmail(existingUser)

        const id = UserId(yield* idGenerator.generate)
        const emailVerified = param.emailVerified ?? false
        const hashedPassword = yield* passwordHasher.hash(param.password).pipe(
            Effect.mapError(() =>
                applicationError(ApplicationErrorCode.FAILED_TO_CREATE_USER),
            ),
        )

        let emailToken: string | undefined
        let emailVerification: CreateUserRecord["emailVerification"]

        if (!emailVerified) {
            emailToken = yield* tokenSigner.sign(id).pipe(
                Effect.mapError(() =>
                    applicationError(
                        ApplicationErrorCode
                            .FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN,
                    ),
                ),
            )
            const hashedToken = yield* passwordHasher.hash(emailToken).pipe(
                Effect.mapError(() =>
                    applicationError(
                        ApplicationErrorCode
                            .FAILED_TO_CREATE_EMAIL_VERIFICATION_TOKEN,
                    ),
                ),
            )
            const tokenId = AuthTokenId(yield* idGenerator.generate)
            const now = yield* Clock.currentTimeMillis

            emailVerification = {
                id: tokenId,
                hashedToken,
                expiresAt: new Date(now + 1000 * 60 * 60),
            }
        }

        const permissions: CreateUserRecord["permissions"] = []
        for (const permissionId of param.permissions ?? []) {
            const recordId = UserPermissionId(yield* idGenerator.generate)
            permissions.push({
                id: recordId,
                permissionId: PermissionId(permissionId),
            })
        }

        yield* repository.createUser({
            id,
            email: param.email,
            emailVerified,
            emailVerification,
            hashedPassword,
            permissions,
        })

        if (emailToken) {
            yield* emailSender
                .send({
                    to: param.email,
                    subject: "Verify your email",
                    html: verifyEmailTemplate(
                        emailToken,
                        frontendConfig.url,
                    ),
                })
                .pipe(
                    Effect.mapError(() =>
                        applicationError(
                            ApplicationErrorCode.FAILED_TO_SEND_EMAIL,
                        ),
                    ),
                )
        }

        return { id }
    }).pipe(
        Effect.catchTag("UserRepositoryError", (error) => {
            let code = ApplicationErrorCode.INTERNAL

            if (error.operation === "createUser") {
                code = ApplicationErrorCode.FAILED_TO_CREATE_USER
            }

            return Effect.fail(applicationError(code))
        }),
    )
