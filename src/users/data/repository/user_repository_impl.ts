import { Effect, Layer } from "effect"

import type { Database } from "@/db/database"
import { toUserWithPermissions } from "@/src/users/data/model/user_model"
import { getCountActiveUsers } from "@/src/users/data/source/count_active_users"
import { createUser } from "@/src/users/data/source/create_user"
import { getActiveUserByEmail } from "@/src/users/data/source/find_active_user_by_email"
import { getActiveUserById } from "@/src/users/data/source/find_active_user_by_id"
import { getListActiveUsers } from "@/src/users/data/source/list_active_users"
import { deleteUser } from "@/src/users/data/source/soft_delete_user"
import {
    UserRepository,
    UserRepositoryError,
} from "@/src/users/domain/repository/user_repository"
import type { Locks } from "@/utils/services/lock-manager"

const repositoryError =
    (operation: UserRepositoryError["operation"]) => (cause: unknown) =>
        new UserRepositoryError({ cause, operation })

export const makeUserRepositoryLayer = (
    database: Database,
    locks: Locks,
) =>
    Layer.succeed(UserRepository, {
        getCountActiveUsers: () =>
            Effect.tryPromise({
                try: () => getCountActiveUsers(database),
                catch: repositoryError("getCountActiveUsers"),
            }),
        createUser: (user) =>
            Effect.tryPromise({
                try: () => createUser(database, user),
                catch: repositoryError("createUser"),
            }),
        getActiveUserByEmail: (email) =>
            Effect.tryPromise({
                try: async () => {
                    const row = await getActiveUserByEmail(database, email)

                    if (!row) {
                        return null
                    }

                    return toUserWithPermissions(row)
                },
                catch: repositoryError("getActiveUserByEmail"),
            }),
        getActiveUserById: (id) =>
            Effect.tryPromise({
                try: async () => {
                    const row = await getActiveUserById(database, id)

                    if (!row) {
                        return null
                    }

                    return toUserWithPermissions(row)
                },
                catch: repositoryError("getActiveUserById"),
            }),
        getListActiveUsers: (query) =>
            Effect.tryPromise({
                try: async () => {
                    const rows = await getListActiveUsers(database, query)
                    return rows.map(toUserWithPermissions)
                },
                catch: repositoryError("getListActiveUsers"),
            }),
        deleteUser: (id) =>
            Effect.tryPromise({
                try: () => deleteUser(database, locks, id),
                catch: repositoryError("deleteUser"),
            }),
    })
