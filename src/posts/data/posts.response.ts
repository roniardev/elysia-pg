import { t } from "elysia"

export const readPostResponse = t.Object({
    message: t.String(),
    data: t.Array(
        t.Object({
            id: t.String(),
            title: t.String(),
            excerpt: t.String(),
            content: t.String(),
            createdAt: t.String(),
            updatedAt: t.String(),
        }),
    ),
})

export type IReadPostResponse = typeof readPostResponse.static
