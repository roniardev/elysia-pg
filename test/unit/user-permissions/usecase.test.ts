import { describe, expect, test } from "bun:test"
import { Effect } from "effect"

import {
    PermissionId,
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity_id"
import { IdGenerator } from "@/src/general/service/id_generator"
import type {
    UserPermission,
    UserPermissionDetail,
} from "@/src/user-permissions/domain/entity/user_permission"
import {
    UserPermissionRepository,
    type UserPermissionRepositoryService,
} from "@/src/user-permissions/domain/repository/user_permission_repository"
import { createUserPermissionUsecase } from "@/src/user-permissions/domain/usecase/create_user_permission_usecase"
import { getListUserPermissionUsecase } from "@/src/user-permissions/domain/usecase/get_list_user_permission_usecase"
import { getUserPermissionUsecase } from "@/src/user-permissions/domain/usecase/get_user_permission_usecase"

const assignment: UserPermission = {
    id: UserPermissionId("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
    userId: UserId("01ARZ3NDEKTSV4RRFFQ69G5FAA"),
    permissionId: PermissionId("01ARZ3NDEKTSV4RRFFQ69G5FAB"),
    revoked: false,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: null,
}

const detail: UserPermissionDetail = {
    ...assignment,
    permission: {
        id: assignment.permissionId,
        name: "users:read",
        description: "Read users",
    },
}

const repository: UserPermissionRepositoryService = {
    getCountUserPermissions: () => Effect.succeed(1),
    createUserPermission: (param) =>
        Effect.succeed({
            ...assignment,
            ...param,
        }),
    deleteUserPermission: () => Effect.void,
    getActiveUserPermissionAssignment: () =>
        Effect.succeed<UserPermission | null>(null),
    getUserPermissionById: () =>
        Effect.succeed<UserPermissionDetail | null>(detail),
    getListUserPermissions: () => Effect.succeed([detail]),
    updateUserPermission: () => Effect.succeed<UserPermission | null>(assignment),
}

describe("User permission use cases", () => {
    test("creates using replaceable ID and repository requirements", async () => {
        const result = await createUserPermissionUsecase({
            userId: assignment.userId,
            permissionId: assignment.permissionId,
        }).pipe(
            Effect.provideService(IdGenerator, {
                generate: Effect.succeed(assignment.id),
            }),
            Effect.provideService(UserPermissionRepository, repository),
            Effect.runPromise,
        )

        expect(result.id).toBe(assignment.id)
    })

    test("reads a permission assignment", async () => {
        const result = await getUserPermissionUsecase(assignment.id).pipe(
            Effect.provideService(UserPermissionRepository, repository),
            Effect.runPromise,
        )

        expect(result.permission.name).toBe("users:read")
    })

    test("reads paginated assignments", async () => {
        const result = await getListUserPermissionUsecase({
            userId: assignment.userId,
            page: 1,
            limit: 10,
        }).pipe(
            Effect.provideService(UserPermissionRepository, repository),
            Effect.runPromise,
        )

        expect(result.data).toHaveLength(1)
    })
})
