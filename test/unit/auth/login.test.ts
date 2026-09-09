import { describe, expect, test } from "bun:test"
import { Effect } from "effect"

import type { AuthUser } from "@/src/auth/domain/entity/auth"
import { AuthRepository } from "@/src/auth/domain/repository/auth_repository"
import { AuthSessionRepository } from "@/src/auth/domain/repository/auth_session_repository"
import { AuthTokens } from "@/src/auth/domain/repository/auth_token_service"
import { loginUsecase } from "@/src/auth/domain/usecase/login_usecase"
import { UserId } from "@/src/general/domain/entity_id"
import { PasswordHasher } from "@/src/general/service/password_hasher"

const user: AuthUser = {
    id: UserId("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
    email: "user@example.com",
    emailVerified: true,
    hashedPassword: "hashed-password",
    photo: null,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: null,
    deletedAt: null,
}

const authRepository = {
    createEmailVerificationToken: () => Effect.void,
    createPasswordResetToken: () => Effect.void,
    createUser: () => Effect.succeed(true),
    getEmailVerificationToken: () => Effect.succeed(null),
    getPasswordResetToken: () => Effect.succeed(null),
    getUserByEmail: () => Effect.succeed(user),
    getUserById: () => Effect.succeed(user),
    resetPassword: () => Effect.void,
    verifyEmail: () => Effect.void,
}

const sessionRepository = {
    delete: () => Effect.succeed(true),
    getAccess: () => Effect.succeed(null),
    getRefresh: () => Effect.succeed(null),
    store: () => Effect.succeed(true),
}

describe("Authentication login", () => {
    test("builds and stores a session through replaceable requirements", async () => {
        const result = await loginUsecase({
            email: user.email,
            password: "password",
        }).pipe(
            Effect.provideService(AuthRepository, authRepository),
            Effect.provideService(AuthSessionRepository, sessionRepository),
            Effect.provideService(AuthTokens, {
                sign: (_userId, kind) => Effect.succeed(`${kind}-token`),
                verify: () => Effect.succeed(user.id),
            }),
            Effect.provideService(PasswordHasher, {
                hash: () => Effect.succeed("hashed"),
                verify: () => Effect.succeed(true),
            }),
            Effect.runPromise,
        )

        expect(result).toEqual({
            accessToken: "access-token",
            refreshToken: "refresh-token",
        })
    })

    test("rejects malformed email before loading requirements", async () => {
        const result = await loginUsecase({
            email: "invalid",
            password: "password",
        }).pipe(
            Effect.provideService(AuthRepository, authRepository),
            Effect.provideService(AuthSessionRepository, sessionRepository),
            Effect.provideService(AuthTokens, {
                sign: () => Effect.succeed("token"),
                verify: () => Effect.succeed(user.id),
            }),
            Effect.provideService(PasswordHasher, {
                hash: () => Effect.succeed("hashed"),
                verify: () => Effect.succeed(true),
            }),
            Effect.either,
            Effect.runPromise,
        )

        expect(result._tag).toBe("Left")
    })
})
