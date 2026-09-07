import { Context, Data, type Effect } from "effect"

import type {
    AuthUser,
    StoredAuthToken,
} from "@/src/auth/domain/entity/auth"
import type {
    AuthTokenId,
    UserId,
} from "@/src/general/domain/entity-id"

export class AuthRepositoryError extends Data.TaggedError(
    "AuthRepositoryError",
)<{
        cause: unknown
        operation:
            | "createEmailVerificationToken"
            | "createPasswordResetToken"
            | "createUser"
            | "getEmailVerificationToken"
            | "getPasswordResetToken"
            | "getUserByEmail"
            | "getUserById"
            | "resetPassword"
            | "verifyEmail"
    }> {}

export type AuthRepositoryService = {
    createEmailVerificationToken: (param: {
        email: string
        expiresAt: Date
        hashedToken: string
        id: AuthTokenId
        userId: UserId
    }) => Effect.Effect<void, AuthRepositoryError>
    createPasswordResetToken: (param: {
        expiresAt: Date
        hashedToken: string
        id: AuthTokenId
        userId: UserId
    }, lockOwner: string) => Effect.Effect<void, AuthRepositoryError>
    createUser: (param: {
        email: string
        hashedPassword: string
        id: UserId
    }) => Effect.Effect<boolean, AuthRepositoryError>
    getEmailVerificationToken: (
        userId: UserId,
    ) => Effect.Effect<StoredAuthToken | null, AuthRepositoryError>
    getPasswordResetToken: (
        userId: UserId,
    ) => Effect.Effect<StoredAuthToken | null, AuthRepositoryError>
    getUserByEmail: (
        email: string,
        verifiedOnly?: boolean,
    ) => Effect.Effect<AuthUser | null, AuthRepositoryError>
    getUserById: (
        id: UserId,
    ) => Effect.Effect<AuthUser | null, AuthRepositoryError>
    resetPassword: (
        userId: UserId,
        hashedPassword: string,
    ) => Effect.Effect<void, AuthRepositoryError>
    verifyEmail: (
        tokenId: AuthTokenId,
        userId: UserId,
    ) => Effect.Effect<void, AuthRepositoryError>
}

export const AuthRepository =
    Context.GenericTag<AuthRepositoryService>("AuthRepository")
