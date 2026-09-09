import { Context, Data, type Effect } from "effect"

import type {
    CreateUserRecord,
    UserListQuery,
    UserWithPermissions,
} from "@/src/users/domain/entity/user"
import type { UserId } from "@/src/general/domain/entity_id"

export class UserRepositoryError extends Data.TaggedError(
    "UserRepositoryError",
)<{
        cause: unknown
        operation:
            | "getCountActiveUsers"
            | "createUser"
            | "getActiveUserByEmail"
            | "getActiveUserById"
            | "getListActiveUsers"
            | "deleteUser"
    }> {}

export type UserRepositoryService = {
    readonly getCountActiveUsers: () => Effect.Effect<
        number,
        UserRepositoryError
    >
    readonly createUser: (
        user: CreateUserRecord,
    ) => Effect.Effect<void, UserRepositoryError>
    readonly getActiveUserByEmail: (
        email: string,
    ) => Effect.Effect<UserWithPermissions | null, UserRepositoryError>
    readonly getActiveUserById: (
        id: UserId,
    ) => Effect.Effect<UserWithPermissions | null, UserRepositoryError>
    readonly getListActiveUsers: (
        query: UserListQuery,
    ) => Effect.Effect<UserWithPermissions[], UserRepositoryError>
    readonly deleteUser: (
        id: UserId,
    ) => Effect.Effect<void, UserRepositoryError>
}

export const UserRepository =
    Context.GenericTag<UserRepositoryService>("UserRepository")
