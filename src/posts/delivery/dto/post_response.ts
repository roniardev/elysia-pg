import { t } from "elysia"

import { postIdSchema } from "@/src/general/delivery/entity_id_schema"

export const getPostResponse = t.Object({
    message: t.String(),
    data: t.Array(
        t.Object({
            id: postIdSchema,
            title: t.String(),
            excerpt: t.String(),
            content: t.String(),
            createdAt: t.String(),
            updatedAt: t.String(),
        }),
    ),
})

export type IGetPostResponse = typeof getPostResponse.static
