import { Context, Data, type Effect } from "effect"

import type {
    CreatePermissionRecord,
    Permission,
    PermissionListQuery,
    PermissionUpdate,
} from "@/src/permissions/domain/entity/permission"
import type { PermissionId } from "@/src/general/domain/entity_id"

export class PermissionRepositoryError extends Data.TaggedError(
    "PermissionRepositoryError",
)<{
        cause: unknown
        operation:
            | "getCountActivePermissions"
            | "createPermission"
            | "getActivePermissionById"
            | "getListActivePermissions"
            | "deletePermission"
            | "updatePermission"
    }> {}

export type PermissionRepositoryService = {
    getCountActivePermissions: (
        search?: string,
    ) => Effect.Effect<number, PermissionRepositoryError>
    createPermission: (
        param: CreatePermissionRecord,
    ) => Effect.Effect<Permission, PermissionRepositoryError>
    getActivePermissionById: (
        id: PermissionId,
    ) => Effect.Effect<Permission | null, PermissionRepositoryError>
    getListActivePermissions: (
        param: PermissionListQuery,
    ) => Effect.Effect<Permission[], PermissionRepositoryError>
    deletePermission: (
        id: PermissionId,
        lockOwner: string,
    ) => Effect.Effect<void, PermissionRepositoryError>
    updatePermission: (
        id: PermissionId,
        param: PermissionUpdate,
        lockOwner: string,
    ) => Effect.Effect<Permission | null, PermissionRepositoryError>
}

export const PermissionRepository =
    Context.GenericTag<PermissionRepositoryService>("PermissionRepository")
