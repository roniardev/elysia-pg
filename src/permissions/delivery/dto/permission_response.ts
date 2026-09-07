import { t } from "elysia"

import { permissionIdSchema } from "@/src/general/delivery/entity-id-schema"

export const getPermissionResponse = t.Object({
    message: t.String(),
    data: t.Array(
        t.Object({
            id: permissionIdSchema,
            name: t.String(),
            description: t.Optional(t.String()),
            createdAt: t.String(),
            updatedAt: t.String(),
        }),
    ),
})

export type IGetPermissionResponse = typeof getPermissionResponse.static
