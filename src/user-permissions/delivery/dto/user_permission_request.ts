import { Elysia, t } from "elysia"

import {
    permissionIdSchema,
    userIdSchema,
    userPermissionIdSchema,
} from "@/src/general/delivery/entity-id-schema"

export const createUserPermissionModel = new Elysia().model({
    createUserPermissionModel: t.Object({
        userId: userIdSchema,
        permissionId: permissionIdSchema,
    }),
})

export const getListUserPermissionModel = new Elysia().model({
    getListUserPermissionModel: t.Object({
        userId: userIdSchema,
        page: t.Integer({ minimum: -1 }),
        limit: t.Integer({ minimum: 1, maximum: 100 }),
        includeRevoked: t.Optional(t.Boolean()),
    }),
})

export const updateUserPermissionModel = new Elysia().model({
    updateUserPermissionModel: t.Object({
        revoked: t.Boolean(),
    }),
})

export const deleteUserPermissionModel = new Elysia().model({
    deleteUserPermissionModel: t.Object({
        id: userPermissionIdSchema,
    }),
})

export const getUserPermissionModel = new Elysia().model({
    getUserPermissionModel: t.Object({
        id: userPermissionIdSchema,
    }),
})
