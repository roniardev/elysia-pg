import { Elysia, t } from "elysia"

export const createUserPermissionModel = new Elysia().model({
    createUserPermissionModel: t.Object({
        userId: t.String(),
        permissionId: t.String(),
    }),
})

export const readAllUserPermissionModel = new Elysia().model({
    readAllUserPermissionModel: t.Object({
        userId: t.String(),
        page: t.Number(),
        limit: t.Number(),
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
        id: t.String(),
    }),
})

export const readUserPermissionModel = new Elysia().model({
    readUserPermissionModel: t.Object({
        id: t.String(),
    }),
})
