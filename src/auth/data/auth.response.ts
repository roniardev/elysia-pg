import { t } from "elysia"

export const authSessionResponse = t.Object({
    accessToken: t.String(),
    refreshToken: t.String(),
})

export type IAuthSessionResponse = typeof authSessionResponse.static
