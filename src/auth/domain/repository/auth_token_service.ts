import { Context, Data, type Effect } from "effect"

import type { UserId } from "@/src/general/domain/entity-id"

import type { AuthTokenKind } from "@/src/auth/domain/entity/auth"

export class AuthTokenError extends Data.TaggedError("AuthTokenError")<{
    cause: unknown
}> {}

export type AuthTokenService = {
    sign: (
        userId: UserId,
        kind: AuthTokenKind,
    ) => Effect.Effect<string, AuthTokenError>
    verify: (
        token: string,
        kind: AuthTokenKind,
    ) => Effect.Effect<UserId, AuthTokenError>
}

export const AuthTokens =
    Context.GenericTag<AuthTokenService>("AuthTokens")
