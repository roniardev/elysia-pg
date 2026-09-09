import { t } from "elysia"
import { type Static } from "typebox"

export const generalResponse = t.Object({
    status: t.Boolean(),
    message: t.String(),
    data: t.Any(),
    total: t.Optional(t.Number()),
    totalPage: t.Optional(t.Number()),
    page: t.Optional(t.Number()),
    limit: t.Optional(t.Number()),
})

export type GeneralResponse = Static<typeof generalResponse>
