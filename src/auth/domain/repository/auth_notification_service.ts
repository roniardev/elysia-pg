import { Context, Data, type Effect } from "effect"

import type { UserId } from "@/src/general/domain/entity_id"

export class AuthNotificationError extends Data.TaggedError(
    "AuthNotificationError",
)<{
        cause: unknown
    }> {}

export type AuthNotificationService = {
    sendPasswordReset: (
        email: string,
        userId: UserId,
        token: string,
    ) => Effect.Effect<void, AuthNotificationError>
}

export const AuthNotification =
    Context.GenericTag<AuthNotificationService>("AuthNotification")
