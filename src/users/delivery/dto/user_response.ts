import { t } from "elysia"

import { userIdSchema } from "@/src/general/delivery/entity_id_schema"

export const getUserResponse = t.Object({
    message: t.String(),
    data: t.Array(
        t.Object({
            id: userIdSchema,
            email: t.String(),
            emailVerified: t.Boolean(),
            createdAt: t.String(),
            updatedAt: t.String(),
        }),
    ),
})

export type IGetUserResponse = typeof getUserResponse.static
