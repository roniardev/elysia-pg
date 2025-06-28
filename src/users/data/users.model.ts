import { Elysia, t } from "elysia"

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
        id: t.String(),
    }),
})

export const readAllUserModel = new Elysia().model({
    readAllUserModel: t.Object({
        page: t.Number(),
        limit: t.Number(),
    }),
})

export const deleteUserModel = new Elysia().model({
    deleteUserModel: t.Object({
        id: t.String(),
    }),
})
