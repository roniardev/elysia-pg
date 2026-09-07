import { Effect, Layer } from "effect"

import type { Database } from "@/db/database"
import {
    toAuthUser,
    toStoredAuthToken,
} from "@/src/auth/data/model/auth_model"
import { createEmailVerificationToken } from "@/src/auth/data/source/create_email_verification_token"
import { createPasswordResetToken } from "@/src/auth/data/source/create_password_reset_token"
import { createRegisteredUser } from "@/src/auth/data/source/create_registered_user"
import { findActiveEmailVerificationToken } from "@/src/auth/data/source/find_active_email_verification_token"
import { findActivePasswordResetToken } from "@/src/auth/data/source/find_active_password_reset_token"
import { findAuthUserByEmail } from "@/src/auth/data/source/find_auth_user_by_email"
import { findAuthUserById } from "@/src/auth/data/source/find_auth_user_by_id"
import { resetUserPassword } from "@/src/auth/data/source/reset_user_password"
import { verifyUserEmail } from "@/src/auth/data/source/verify_user_email"
import {
    AuthRepository,
    AuthRepositoryError,
} from "@/src/auth/domain/repository/auth_repository"
import type { Locks } from "@/utils/services/lock-manager"

const repositoryError =
    (operation: AuthRepositoryError["operation"]) => (cause: unknown) =>
        new AuthRepositoryError({ cause, operation })

export const makeAuthRepositoryLayer = (
    database: Database,
    locks: Locks,
) => Layer.succeed(AuthRepository, {
    createEmailVerificationToken: (param) => Effect.tryPromise({
        try: async () => {
            await createEmailVerificationToken(database, param)
        },
        catch: repositoryError("createEmailVerificationToken"),
    }),
    createPasswordResetToken: (param, lockOwner) => Effect.tryPromise({
        try: async () => {
            await createPasswordResetToken(database, locks, param, lockOwner)
        },
        catch: repositoryError("createPasswordResetToken"),
    }),
    createUser: (param) => Effect.tryPromise({
        try: async () => {
            const result = await createRegisteredUser(database, locks, param)
            return result[0]
        },
        catch: repositoryError("createUser"),
    }),
    getEmailVerificationToken: (userId) => Effect.tryPromise({
        try: async () => {
            const row = await findActiveEmailVerificationToken(database, userId)

            if (!row) {
                return null
            }

            return toStoredAuthToken(row)
        },
        catch: repositoryError("getEmailVerificationToken"),
    }),
    getPasswordResetToken: (userId) => Effect.tryPromise({
        try: async () => {
            const row = await findActivePasswordResetToken(database, userId)

            if (!row) {
                return null
            }

            return toStoredAuthToken(row)
        },
        catch: repositoryError("getPasswordResetToken"),
    }),
    getUserByEmail: (email, verifiedOnly) => Effect.tryPromise({
        try: async () => {
            const row = await findAuthUserByEmail(database, email, verifiedOnly)

            if (!row) {
                return null
            }

            return toAuthUser(row)
        },
        catch: repositoryError("getUserByEmail"),
    }),
    getUserById: (id) => Effect.tryPromise({
        try: async () => {
            const row = await findAuthUserById(database, id)

            if (!row) {
                return null
            }

            return toAuthUser(row)
        },
        catch: repositoryError("getUserById"),
    }),
    resetPassword: (userId, hashedPassword) => Effect.tryPromise({
        try: async () => {
            await resetUserPassword(database, locks, userId, hashedPassword)
        },
        catch: repositoryError("resetPassword"),
    }),
    verifyEmail: (tokenId, userId) => Effect.tryPromise({
        try: () => verifyUserEmail(database, locks, tokenId, userId),
        catch: repositoryError("verifyEmail"),
    }),
})
