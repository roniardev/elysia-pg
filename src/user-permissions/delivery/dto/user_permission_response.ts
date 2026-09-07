import { t } from "elysia"

import {
    permissionIdSchema,
    userIdSchema,
    userPermissionIdSchema,
} from "@/src/general/delivery/entity-id-schema"

export const getUserPermissionResponse = t.Object({
    message: t.String(),
    data: t.Array(
        t.Object({
            id: userPermissionIdSchema,
            userId: userIdSchema,
            permissionId: permissionIdSchema,
            createdAt: t.String(),
            updatedAt: t.String(),
            revoked: t.Boolean(),
        }),
    ),
})

export type IReadUserPermissionResponse =
    typeof getUserPermissionResponse.static
