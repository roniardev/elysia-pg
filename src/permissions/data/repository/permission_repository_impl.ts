import { Effect, Layer } from "effect"

import type { Database } from "@/db/database"
import { toPermission } from "@/src/permissions/data/model/permission_model"
import { getCountActivePermissions } from "@/src/permissions/data/source/count_active_permissions"
import { createPermission } from "@/src/permissions/data/source/create_permission"
import { getActivePermissionById } from "@/src/permissions/data/source/find_active_permission_by_id"
import { getListActivePermissions } from "@/src/permissions/data/source/list_active_permissions"
import { deletePermission } from "@/src/permissions/data/source/soft_delete_permission"
import { updatePermission } from "@/src/permissions/data/source/update_permission"
import {
    PermissionRepository,
    PermissionRepositoryError,
} from "@/src/permissions/domain/repository/permission_repository"
import type { Locks } from "@/utils/services/lock-manager"

const repositoryError =
    (operation: PermissionRepositoryError["operation"]) => (cause: unknown) =>
        new PermissionRepositoryError({ cause, operation })

export const makePermissionRepositoryLayer = (
    database: Database,
    locks: Locks,
) =>
    Layer.succeed(PermissionRepository, {
        getCountActivePermissions: (search) =>
            Effect.tryPromise({
                try: () => getCountActivePermissions(database, search),
                catch: repositoryError("getCountActivePermissions"),
            }),
        createPermission: (param) =>
            Effect.tryPromise({
                try: async () =>
                    toPermission(await createPermission(database, param)),
                catch: repositoryError("createPermission"),
            }),
        getActivePermissionById: (id) =>
            Effect.tryPromise({
                try: async () => {
                    const row = await getActivePermissionById(database, id)

                    if (!row) {
                        return null
                    }

                    return toPermission(row)
                },
                catch: repositoryError("getActivePermissionById"),
            }),
        getListActivePermissions: (param) =>
            Effect.tryPromise({
                try: async () => {
                    const rows = await getListActivePermissions(database, param)
                    return rows.map(toPermission)
                },
                catch: repositoryError("getListActivePermissions"),
            }),
        deletePermission: (id, lockOwner) =>
            Effect.tryPromise({
                try: () =>
                    deletePermission(database, locks, id, lockOwner),
                catch: repositoryError("deletePermission"),
            }),
        updatePermission: (id, param, lockOwner) =>
            Effect.tryPromise({
                try: async () => {
                    const row = await updatePermission(
                        database,
                        locks,
                        id,
                        param,
                        lockOwner,
                    )

                    if (!row) {
                        return null
                    }

                    return toPermission(row)
                },
                catch: repositoryError("updatePermission"),
            }),
    })
