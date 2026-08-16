import { Elysia, t } from "elysia"

import { ULID_PATTERN } from "@/utils/ulid"

export const createUserModel = new Elysia().model({
    createUserModel: t.Object({
        email: t.String(),
        password: t.String(),
        emailVerified: t.Optional(t.Boolean()),
        permissions: t.Optional(t.Array(t.String())),
    }),
})

export const readUserModel = new Elysia().model({
    readUserModel: t.Object({
        id: t.String({ pattern: ULID_PATTERN }),
    }),
})

export const readAllUserModel = new Elysia().model({
    readAllUserModel: t.Object({
        page: t.Integer({ minimum: -1 }),
        limit: t.Integer({ minimum: 1, maximum: 100 }),
    }),
})

export const deleteUserModel = new Elysia().model({
    deleteUserModel: t.Object({
        id: t.String({ pattern: ULID_PATTERN }),
    }),
})
