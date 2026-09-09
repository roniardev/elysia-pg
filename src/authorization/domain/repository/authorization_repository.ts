import { Context, Data, type Effect } from "effect"

import type {
    PermissionGrant,
    PermissionName,
} from "@/src/authorization/domain/entity/authorization"
import type { UserId } from "@/src/general/domain/entity_id"

export class AuthorizationRepositoryError extends Data.TaggedError(
    "AuthorizationRepositoryError",
)<{
        cause: unknown
        operation:
            | "getActiveAuthorizationUser"
            | "getPermissionGrant"
            | "verifyAuthorizationSession"
    }> {}

export type AuthorizationRepositoryService = {
    getActiveAuthorizationUser: (
        userId: UserId,
    ) => Effect.Effect<boolean, AuthorizationRepositoryError>
    getPermissionGrant: (
        userId: UserId,
        permission: PermissionName,
    ) => Effect.Effect<PermissionGrant | null, AuthorizationRepositoryError>
    verifyAuthorizationSession: (
        userId: UserId,
        accessToken: string,
        tokenExpiresAt?: number,
    ) => Effect.Effect<boolean, AuthorizationRepositoryError>
}

export const AuthorizationRepository =
    Context.GenericTag<AuthorizationRepositoryService>(
        "AuthorizationRepository",
    )
