import { t } from "elysia"
import { type Static } from "typebox"

export const authSessionResponse = t.Object({
    accessToken: t.String(),
    refreshToken: t.String(),
})

export type IAuthSessionResponse = Static<typeof authSessionResponse>
