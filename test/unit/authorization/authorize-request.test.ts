import { describe, expect, test } from "bun:test"
import { Effect } from "effect"

import { UserPermission } from "@/common/enum/permissions"
import type { db } from "@/db"
import { getUserPermissionGrant } from "@/src/authorization/data/source/find_user_permission_grant"
import {
    AuthorizationRepository,
    type AuthorizationRepositoryService,
} from "@/src/authorization/domain/repository/authorization_repository"
import { authorizeRequestUsecase } from "@/src/authorization/domain/usecase/authorize_request_usecase"
import { ApplicationErrorCode } from "@/src/general/domain/application_error"
import {
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity_id"

const request = {
    accessToken: "access-token",
    permission: UserPermission.READ_USER,
    tokenExpiresAt: 2_000_000_000,
    userId: UserId("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
}

const repository: AuthorizationRepositoryService = {
    getActiveAuthorizationUser: () => Effect.succeed(true),
    getPermissionGrant: () => Effect.succeed({
        id: UserPermissionId("01ARZ3NDEKTSV4RRFFQ69G5FAA"),
        scope: "personal",
    }),
    verifyAuthorizationSession: () => Effect.succeed(true),
}

describe("Authorize request", () => {
    test("returns the authenticated user and granted scope", async () => {
        const result = await authorizeRequestUsecase(request).pipe(
            Effect.provideService(AuthorizationRepository, repository),
            Effect.runPromise,
        )

        expect(result).toEqual({
            userId: request.userId,
            scope: "personal",
        })
    })

    test("rejects an invalid session before loading the user", async () => {
        let userLoaded = false
        const result = await authorizeRequestUsecase(request).pipe(
            Effect.provideService(AuthorizationRepository, {
                ...repository,
                verifyAuthorizationSession: () => Effect.succeed(false),
                getActiveAuthorizationUser: () => Effect.sync(() => {
                    userLoaded = true
                    return true
                }),
            }),
            Effect.either,
            Effect.runPromise,
        )

        expect(result._tag).toBe("Left")
        expect(userLoaded).toBe(false)
        if (result._tag === "Left") {
            expect(result.left.code).toBe(ApplicationErrorCode.UNAUTHORIZED)
        }
    })

    test("distinguishes an invalid user from a missing grant", async () => {
        const invalidUser = await authorizeRequestUsecase(request).pipe(
            Effect.provideService(AuthorizationRepository, {
                ...repository,
                getActiveAuthorizationUser: () => Effect.succeed(false),
            }),
            Effect.either,
            Effect.runPromise,
        )
        const missingGrant = await authorizeRequestUsecase(request).pipe(
            Effect.provideService(AuthorizationRepository, {
                ...repository,
                getPermissionGrant: () => Effect.succeed(null),
            }),
            Effect.either,
            Effect.runPromise,
        )

        if (invalidUser._tag === "Left") {
            expect(invalidUser.left.code).toBe(
                ApplicationErrorCode.INVALID_USER,
            )
        }
        if (missingGrant._tag === "Left") {
            expect(missingGrant.left.code).toBe(
                ApplicationErrorCode.UNAUTHORIZED_PERMISSION,
            )
        }
    })

    test("finds the requested grant instead of inspecting only the first grant", async () => {
        const database = {
            query: {
                userPermissions: {
                    findMany: async () => [
                        {
                            id: "first-grant",
                            permission: { name: UserPermission.CREATE_USER },
                            scopeUserPermissions: [],
                        },
                        {
                            id: "requested-grant",
                            permission: { name: UserPermission.READ_USER },
                            scopeUserPermissions: [{
                                scope: { name: "personal" },
                            }],
                        },
                    ],
                },
            },
        } as unknown as typeof db

        const grant = await getUserPermissionGrant(
            database,
            request.userId,
            UserPermission.READ_USER,
        )

        expect(grant).toEqual({
            id: "requested-grant",
            scope: "personal",
        })
    })
})
