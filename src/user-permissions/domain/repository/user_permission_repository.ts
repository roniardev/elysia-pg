import { Context, Data, type Effect } from "effect"

import type {
    CreateUserPermissionParam,
    CreateUserPermissionRecord,
    UpdateUserPermissionParam,
    UserPermission,
    UserPermissionDetail,
    UserPermissionListQuery,
} from "@/src/user-permissions/domain/entity/user_permission"
import type { UserPermissionId } from "@/src/general/domain/entity_id"

export class UserPermissionRepositoryError extends Data.TaggedError(
    "UserPermissionRepositoryError",
)<{
        cause: unknown
        operation:
            | "getCountUserPermissions"
            | "createUserPermission"
            | "deleteUserPermission"
            | "getActiveUserPermissionAssignment"
            | "getUserPermissionById"
            | "getListUserPermissions"
            | "updateUserPermission"
    }> {}

export type UserPermissionRepositoryService = {
    getCountUserPermissions: (
        param: UserPermissionListQuery,
    ) => Effect.Effect<number, UserPermissionRepositoryError>
    createUserPermission: (
        param: CreateUserPermissionRecord,
    ) => Effect.Effect<UserPermission, UserPermissionRepositoryError>
    deleteUserPermission: (
        id: UserPermissionId,
        lockOwner: string,
    ) => Effect.Effect<void, UserPermissionRepositoryError>
    getActiveUserPermissionAssignment: (
        param: CreateUserPermissionParam,
    ) => Effect.Effect<UserPermission | null, UserPermissionRepositoryError>
    getUserPermissionById: (
        id: UserPermissionId,
    ) => Effect.Effect<UserPermissionDetail | null, UserPermissionRepositoryError>
    getListUserPermissions: (
        param: UserPermissionListQuery,
    ) => Effect.Effect<UserPermissionDetail[], UserPermissionRepositoryError>
    updateUserPermission: (
        id: UserPermissionId,
        param: UpdateUserPermissionParam,
        lockOwner: string,
    ) => Effect.Effect<UserPermission | null, UserPermissionRepositoryError>
}

export const UserPermissionRepository =
    Context.GenericTag<UserPermissionRepositoryService>(
        "UserPermissionRepository",
    )
