import { Elysia, t } from "elysia"

import {
    permissionIdSchema,
    userIdSchema,
} from "@/src/general/delivery/entity_id_schema"

export const createUserModel = new Elysia().model({
    createUserModel: t.Object({
        email: t.String(),
        password: t.String(),
        emailVerified: t.Optional(t.Boolean()),
        permissions: t.Optional(t.Array(permissionIdSchema)),
    }),
})

export const getUserModel = new Elysia().model({
    getUserModel: t.Object({
        id: userIdSchema,
    }),
})

export const getListUserModel = new Elysia().model({
    getListUserModel: t.Object({
        page: t.Integer({ minimum: -1 }),
        limit: t.Integer({ minimum: 1, maximum: 100 }),
    }),
})

export const deleteUserModel = new Elysia().model({
    deleteUserModel: t.Object({
        id: userIdSchema,
    }),
})
