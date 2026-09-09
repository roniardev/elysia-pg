import { Elysia, t } from "elysia"

import { permissionIdSchema } from "@/src/general/delivery/entity_id_schema"

export const createPermissionModel = new Elysia().model({
    createPermissionModel: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
    }),
})

export const getListPermissionModel = new Elysia().model({
    getListPermissionModel: t.Object({
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
        id: permissionIdSchema,
    }),
})

export const getPermissionModel = new Elysia().model({
    getPermissionModel: t.Object({
        id: permissionIdSchema,
    }),
})
