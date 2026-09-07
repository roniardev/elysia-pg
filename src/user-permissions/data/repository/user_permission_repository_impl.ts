import { Effect, Layer } from "effect"

import type { Database } from "@/db/database"
import {
    toUserPermission,
    toUserPermissionDetail,
} from "@/src/user-permissions/data/model/user_permission_model"
import { getCountUserPermissions } from "@/src/user-permissions/data/source/count_user_permissions"
import { createUserPermission } from "@/src/user-permissions/data/source/create_user_permission"
import { deleteUserPermission } from "@/src/user-permissions/data/source/delete_user_permission"
import { getActiveUserPermissionAssignment } from "@/src/user-permissions/data/source/find_active_user_permission_assignment"
import { getUserPermissionById } from "@/src/user-permissions/data/source/find_user_permission_by_id"
import { getListUserPermissions } from "@/src/user-permissions/data/source/list_user_permissions"
import { updateUserPermission } from "@/src/user-permissions/data/source/update_user_permission"
import {
    UserPermissionRepository,
    UserPermissionRepositoryError,
} from "@/src/user-permissions/domain/repository/user_permission_repository"
import type { Locks } from "@/utils/services/lock-manager"

const repositoryError =
    (operation: UserPermissionRepositoryError["operation"]) =>
        (cause: unknown) => new UserPermissionRepositoryError({ cause, operation })

export const makeUserPermissionRepositoryLayer = (
    database: Database,
    locks: Locks,
) => Layer.succeed(UserPermissionRepository, {
    getCountUserPermissions: (param) =>
        Effect.tryPromise({
            try: () => getCountUserPermissions(database, param),
            catch: repositoryError("getCountUserPermissions"),
        }),
    createUserPermission: (param) =>
        Effect.tryPromise({
            try: async () => {
                await createUserPermission(database, param)
                return {
                    ...param,
                    revoked: false,
                    createdAt: new Date(),
                    updatedAt: null,
                }
            },
            catch: repositoryError("createUserPermission"),
        }),
    deleteUserPermission: (id, lockOwner) =>
        Effect.tryPromise({
            try: async () => {
                await deleteUserPermission(database, locks, id, lockOwner)
            },
            catch: repositoryError("deleteUserPermission"),
        }),
    getActiveUserPermissionAssignment: (param) =>
        Effect.tryPromise({
            try: async () => {
                const row = await getActiveUserPermissionAssignment(
                    database,
                    param,
                )

                if (!row) {
                    return null
                }

                return toUserPermission(row)
            },
            catch: repositoryError("getActiveUserPermissionAssignment"),
        }),
    getUserPermissionById: (id) =>
        Effect.tryPromise({
            try: async () => {
                const row = await getUserPermissionById(database, id)

                if (!row) {
                    return null
                }

                return toUserPermissionDetail(row)
            },
            catch: repositoryError("getUserPermissionById"),
        }),
    getListUserPermissions: (param) =>
        Effect.tryPromise({
            try: async () => {
                const rows = await getListUserPermissions(database, param)
                return rows.map(toUserPermissionDetail)
            },
            catch: repositoryError("getListUserPermissions"),
        }),
    updateUserPermission: (id, param, lockOwner) =>
        Effect.tryPromise({
            try: async () => {
                const result = await updateUserPermission(
                    database,
                    locks,
                    id,
                    param,
                    lockOwner,
                )
                const didAcquire = result[0]
                const row = result[1]

                if (!didAcquire || !row) {
                    return null
                }

                return toUserPermission(row)
            },
            catch: repositoryError("updateUserPermission"),
        }),
})
