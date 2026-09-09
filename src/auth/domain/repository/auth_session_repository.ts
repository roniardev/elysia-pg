import { Context, Data, type Effect } from "effect"

import type { AuthSession } from "@/src/auth/domain/entity/auth"
import type { UserId } from "@/src/general/domain/entity_id"

export class AuthSessionError extends Data.TaggedError("AuthSessionError")<{
    cause: unknown
    operation: "delete" | "getAccess" | "getRefresh" | "store"
}> {}

export type AuthSessionRepositoryService = {
    delete: (userId: UserId) => Effect.Effect<boolean, AuthSessionError>
    getAccess: (
        userId: UserId,
    ) => Effect.Effect<string | null, AuthSessionError>
    getRefresh: (
        userId: UserId,
    ) => Effect.Effect<string | null, AuthSessionError>
    store: (
        userId: UserId,
        session: AuthSession,
        lockName: string,
    ) => Effect.Effect<boolean, AuthSessionError>
}

export const AuthSessionRepository =
    Context.GenericTag<AuthSessionRepositoryService>("AuthSessionRepository")
