import { Elysia, t } from "elysia"

import { ULID_PATTERN } from "@/utils/ulid"

export const createPermissionModel = new Elysia().model({
    createPermissionModel: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
    }),
})

export const readAllPermissionModel = new Elysia().model({
    readAllPermissionModel: t.Object({
        page: t.Integer({ minimum: -1 }),
        limit: t.Integer({ minimum: 1, maximum: 100 }),
        sort: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        search: t.Optional(t.String({ maxLength: 255 })),
    }),
})

export const updatePermissionModel = new Elysia().model({
    updatePermissionModel: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
    }),
})

export const deletePermissionModel = new Elysia().model({
    deletePermissionModel: t.Object({
        id: t.String({ pattern: ULID_PATTERN }),
    }),
})

export const readPermissionModel = new Elysia().model({
    readPermissionModel: t.Object({
        id: t.String({ pattern: ULID_PATTERN }),
    }),
})
