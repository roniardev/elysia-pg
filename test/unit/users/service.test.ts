import { describe, expect, test } from "bun:test"
import { Effect } from "effect"

import { ApplicationErrorCode } from "@/src/general/domain/application_error"
import {
    UserId,
    type UserId as UserIdType,
} from "@/src/general/domain/entity_id"
import { EmailSender } from "@/src/general/service/email_sender"
import { EmailTokenSigner } from "@/src/general/service/email_token_signer"
import { FrontendConfig } from "@/src/general/service/frontend_config"
import { IdGenerator } from "@/src/general/service/id_generator"
import { PasswordHasher } from "@/src/general/service/password_hasher"
import type {
    CreateUserRecord,
    UserWithPermissions,
} from "@/src/users/domain/entity/user"
import {
    UserRepository,
    UserRepositoryError,
} from "@/src/users/domain/repository/user_repository"
import { createUserUsecase } from "@/src/users/domain/usecase/create_user_usecase"
import { deleteUserUsecase } from "@/src/users/domain/usecase/delete_user_usecase"
import { getListUserUsecase } from "@/src/users/domain/usecase/get_list_user_usecase"
import { getUserUsecase } from "@/src/users/domain/usecase/get_user_usecase"

const user: UserWithPermissions = {
    id: UserId("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
    email: "user@example.com",
    emailVerified: true,
    hashedPassword: "hash",
    photo: null,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: null,
    deletedAt: null,
    permissions: [],
}

const makeRepository = (
    options: {
        getByEmail?: UserWithPermissions | null
        getById?: UserWithPermissions | null
        list?: UserWithPermissions[]
        onCreate?: (user: CreateUserRecord) => void
        onDelete?: (id: UserIdType) => void
    } = {},
) => ({
    getCountActiveUsers: () => Effect.succeed(options.list?.length ?? 0),
    createUser: (record: CreateUserRecord) =>
        Effect.sync(() => {
            options.onCreate?.(record)
        }),
    getActiveUserByEmail: () => Effect.succeed(options.getByEmail ?? null),
    getActiveUserById: () => Effect.succeed(options.getById ?? null),
    getListActiveUsers: () => Effect.succeed(options.list ?? []),
    deleteUser: (id: UserIdType) =>
        Effect.sync(() => {
            options.onDelete?.(id)
        }),
})

describe("UserService", () => {
    test("creates a user with replaceable infrastructure", async () => {
        const ids = [
            "01ARZ3NDEKTSV4RRFFQ69G5FAV",
            "01ARZ3NDEKTSV4RRFFQ69G5FAW",
        ]
        let created: CreateUserRecord | undefined
        let sentTo: string | undefined
        const program = createUserUsecase({
            email: "new@example.com",
            password: "secret",
        }).pipe(
            Effect.provideService(EmailSender, {
                send: ({ to }) =>
                    Effect.sync(() => {
                        sentTo = to
                    }),
            }),
            Effect.provideService(EmailTokenSigner, {
                sign: () => Effect.succeed("signed-token"),
            }),
            Effect.provideService(FrontendConfig, {
                url: "https://example.com",
            }),
            Effect.provideService(IdGenerator, {
                generate: Effect.sync(() => ids.shift() ?? "fallback-id"),
            }),
            Effect.provideService(PasswordHasher, {
                hash: (value) => Effect.succeed(`hashed:${value}`),
                verify: () => Effect.succeed(true),
            }),
            Effect.provideService(
                UserRepository,
                makeRepository({
                    onCreate: (record) => {
                        created = record
                    },
                }),
            ),
        )

        const result = await Effect.runPromise(program)

        expect(result.id).toBe(UserId("01ARZ3NDEKTSV4RRFFQ69G5FAV"))
        expect(created?.hashedPassword).toBe("hashed:secret")
        expect(created?.emailVerification?.hashedToken).toBe(
            "hashed:signed-token",
        )
        expect(sentTo).toBe("new@example.com")
    })

    test("rejects a duplicate email before running creation effects", async () => {
        let created = false
        const program = createUserUsecase({
            email: user.email,
            password: "secret",
        }).pipe(
            Effect.provideService(EmailSender, {
                send: () => Effect.void,
            }),
            Effect.provideService(EmailTokenSigner, {
                sign: () => Effect.succeed("signed-token"),
            }),
            Effect.provideService(FrontendConfig, {
                url: "https://example.com",
            }),
            Effect.provideService(IdGenerator, {
                generate: Effect.succeed("unused-id"),
            }),
            Effect.provideService(PasswordHasher, {
                hash: () => Effect.succeed("unused-hash"),
                verify: () => Effect.succeed(true),
            }),
            Effect.provideService(
                UserRepository,
                makeRepository({
                    getByEmail: user,
                    onCreate: () => {
                        created = true
                    },
                }),
            ),
            Effect.either,
        )

        const result = await Effect.runPromise(program)

        expect(result._tag).toBe("Left")
        if (result._tag === "Left") {
            expect(result.left.code).toBe(
                ApplicationErrorCode.USER_ALREADY_EXISTS,
            )
        }
        expect(created).toBe(false)
    })

    test("reads a user through its repository requirement", async () => {
        const result = await getUserUsecase(user.id).pipe(
            Effect.provideService(
                UserRepository,
                makeRepository({ getById: user }),
            ),
            Effect.runPromise,
        )

        expect(result).toEqual({
            id: user.id,
            email: user.email,
            emailVerified: true,
            permissions: [],
        })
    })

    test("returns a domain error when the user does not exist", async () => {
        const result = await getUserUsecase(user.id).pipe(
            Effect.provideService(UserRepository, makeRepository()),
            Effect.either,
            Effect.runPromise,
        )

        expect(result._tag).toBe("Left")
        if (result._tag === "Left") {
            expect(result.left.code).toBe(ApplicationErrorCode.USER_NOT_FOUND)
        }
    })

    test("scopes repository errors before they reach the handler", async () => {
        const repository = {
            ...makeRepository(),
            getActiveUserById: () =>
                Effect.fail(
                    new UserRepositoryError({
                        cause: new Error("connection reset"),
                        operation: "getActiveUserById",
                    }),
                ),
        }
        const result = await getUserUsecase(user.id).pipe(
            Effect.provideService(UserRepository, repository),
            Effect.either,
            Effect.runPromise,
        )

        expect(result._tag).toBe("Left")
        if (result._tag === "Left") {
            expect(result.left.code).toBe(ApplicationErrorCode.INTERNAL)
        }
    })

    test("reads a page without changing the graph for a fake repository", async () => {
        const result = await getListUserUsecase({
            page: 1,
            limit: 10,
        }).pipe(
            Effect.provideService(
                UserRepository,
                makeRepository({ list: [user] }),
            ),
            Effect.runPromise,
        )

        expect(result.data).toHaveLength(1)
        expect(result.data[0]?.id).toBe(user.id)
    })

    test("soft-deletes through the repository requirement", async () => {
        let deletedId: string | undefined
        const result = await deleteUserUsecase(user.id).pipe(
            Effect.provideService(
                UserRepository,
                makeRepository({
                    getById: user,
                    onDelete: (id) => {
                        deletedId = id
                    },
                }),
            ),
            Effect.runPromise,
        )

        expect(result).toEqual({ id: user.id })
        expect(deletedId).toBe(user.id)
    })
})
