import { Effect, Layer } from "effect"

import type { Database } from "@/db/database"
import { toAuthorizationScope } from "@/src/authorization/data/model/authorization_model"
import { getActiveAuthorizationUser } from "@/src/authorization/data/source/find_active_authorization_user"
import { getUserPermissionGrant } from "@/src/authorization/data/source/find_user_permission_grant"
import { verifyAuthorizationSession } from "@/src/authorization/data/source/verify_authorization_session"
import {
    AuthorizationRepository,
    AuthorizationRepositoryError,
} from "@/src/authorization/domain/repository/authorization_repository"
import { UserPermissionId } from "@/src/general/domain/entity_id"
import type { RedisClient } from "@/utils/services/redis-client"

const repositoryError =
    (operation: AuthorizationRepositoryError["operation"]) =>
        (cause: unknown) => new AuthorizationRepositoryError({ cause, operation })

export const makeAuthorizationRepositoryLayer = (
    database: Database,
    cache: RedisClient,
) => Layer.succeed(AuthorizationRepository, {
    getActiveAuthorizationUser: (userId) => Effect.tryPromise({
        try: async () => {
            const user = await getActiveAuthorizationUser(database, userId)
            return Boolean(user)
        },
        catch: repositoryError("getActiveAuthorizationUser"),
    }),
    getPermissionGrant: (userId, permission) => Effect.tryPromise({
        try: async () => {
            const grant = await getUserPermissionGrant(
                database,
                userId,
                permission,
            )

            if (!grant) {
                return null
            }

            return {
                ...grant,
                id: UserPermissionId(grant.id),
                scope: toAuthorizationScope(grant.scope),
            }
        },
        catch: repositoryError("getPermissionGrant"),
    }),
    verifyAuthorizationSession: (userId, accessToken, tokenExpiresAt) =>
        Effect.tryPromise({
            try: () => verifyAuthorizationSession(
                cache,
                userId,
                accessToken,
                tokenExpiresAt,
            ),
            catch: repositoryError("verifyAuthorizationSession"),
        }),
})
