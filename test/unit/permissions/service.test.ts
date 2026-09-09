import { describe, expect, test } from "bun:test"
import { Effect } from "effect"

import { ApplicationErrorCode } from "@/src/general/domain/application_error"
import {
    PermissionId,
    type PermissionId as PermissionIdType,
    UserId,
} from "@/src/general/domain/entity_id"
import { IdGenerator } from "@/src/general/service/id_generator"
import type {
    CreatePermissionRecord,
    Permission,
    PermissionListQuery,
    PermissionUpdate,
} from "@/src/permissions/domain/entity/permission"
import { PermissionRepository } from "@/src/permissions/domain/repository/permission_repository"
import { createPermissionUsecase } from "@/src/permissions/domain/usecase/create_permission_usecase"
import { deletePermissionUsecase } from "@/src/permissions/domain/usecase/delete_permission_usecase"
import { getListPermissionUsecase } from "@/src/permissions/domain/usecase/get_list_permission_usecase"
import { getPermissionUsecase } from "@/src/permissions/domain/usecase/get_permission_usecase"
import { updatePermissionUsecase } from "@/src/permissions/domain/usecase/update_permission_usecase"

const permission: Permission = {
    id: PermissionId("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
    name: "users:read",
    description: "Read users",
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: null,
    deletedAt: null,
}

const makeRepository = (
    options: {
        getById?: Permission | null
        list?: Permission[]
        onCreate?: (param: CreatePermissionRecord) => void
        onDelete?: (id: PermissionIdType) => void
        onUpdate?: (param: PermissionUpdate) => void
    } = {},
) => ({
    getCountActivePermissions: () => Effect.succeed(options.list?.length ?? 0),
    createPermission: (param: CreatePermissionRecord) =>
        Effect.sync(() => {
            options.onCreate?.(param)
            return { ...permission, ...param }
        }),
    deletePermission: (id: PermissionIdType) =>
        Effect.sync(() => {
            options.onDelete?.(id)
        }),
    getActivePermissionById: () => Effect.succeed(options.getById ?? null),
    getListActivePermissions: (_input: PermissionListQuery) =>
        Effect.succeed(options.list ?? []),
    updatePermission: (_id: PermissionIdType, param: PermissionUpdate) =>
        Effect.sync(() => {
            options.onUpdate?.(param)
            if (!options.getById) {
                return null
            }
            return { ...options.getById, ...param }
        }),
})

describe("PermissionService", () => {
    test("creates through replaceable ID and repository requirements", async () => {
        let created: CreatePermissionRecord | undefined
        const result = await createPermissionUsecase({
            name: permission.name,
            description: permission.description ?? undefined,
        }).pipe(
            Effect.provideService(IdGenerator, {
                generate: Effect.succeed(permission.id),
            }),
            Effect.provideService(
                PermissionRepository,
                makeRepository({
                    onCreate: (param) => {
                        created = param
                    },
                }),
            ),
            Effect.runPromise,
        )

        expect(result.id).toBe(permission.id)
        expect(created?.name).toBe(permission.name)
    })

    test("returns a domain error for an unknown permission", async () => {
        const result = await getPermissionUsecase(permission.id).pipe(
            Effect.provideService(
                PermissionRepository,
                makeRepository(),
            ),
            Effect.either,
            Effect.runPromise,
        )

        expect(result._tag).toBe("Left")
        if (result._tag === "Left") {
            expect(result.left.code).toBe(
                ApplicationErrorCode.PERMISSION_NOT_FOUND,
            )
        }
    })

    test("reads paginated permissions with the same test graph", async () => {
        const result = await getListPermissionUsecase({
            page: 1,
            limit: 10,
        }).pipe(
            Effect.provideService(
                PermissionRepository,
                makeRepository({ list: [permission] }),
            ),
            Effect.runPromise,
        )

        expect(result.data).toEqual([permission])
    })

    test("updates through the repository requirement", async () => {
        let update: PermissionUpdate | undefined
        const result = await updatePermissionUsecase(
            permission.id,
            { name: "users:list" },
            UserId("01ARZ3NDEKTSV4RRFFQ69G5FAA"),
        ).pipe(
            Effect.provideService(
                PermissionRepository,
                makeRepository({
                    getById: permission,
                    onUpdate: (param) => {
                        update = param
                    },
                }),
            ),
            Effect.runPromise,
        )

        expect(result.name).toBe("users:list")
        expect(update).toEqual({ name: "users:list" })
    })

    test("deletes through the repository requirement", async () => {
        let deletedId: PermissionIdType | undefined
        await deletePermissionUsecase(
            permission.id,
            UserId("01ARZ3NDEKTSV4RRFFQ69G5FAA"),
        ).pipe(
            Effect.provideService(
                PermissionRepository,
                makeRepository({
                    getById: permission,
                    onDelete: (id) => {
                        deletedId = id
                    },
                }),
            ),
            Effect.runPromise,
        )

        expect(deletedId).toBe(permission.id)
    })
})
