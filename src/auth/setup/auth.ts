import { jwt } from "@elysiajs/jwt"
import { Elysia, t } from "elysia"

import { config } from "@/app/config"

export const jwtAccessSetup = new Elysia({
    name: "jwtAccess",
}).use(
    jwt({
        name: "jwtAccess",
        schema: t.Object({
            id: t.String(),
        }),
        secret: config.JWT_ACCESS_SECRET,
        exp: "25m",
    }),
)

export const jwtRefreshSetup = new Elysia({
    name: "jwtRefresh",
}).use(
    jwt({
        name: "jwtRefresh",
        schema: t.Object({
            id: t.String(),
        }),
        secret: config.JWT_REFRESH_SECRET,
        exp: "7d",
    }),
)

export const jwtEmailSetup = new Elysia({
    name: "jwtEmail",
}).use(
    jwt({
        name: "jwtEmail",
        schema: t.Object({
            id: t.String(),
        }),
        secret: config.JWT_EMAIL_SECRET,
        exp: "15m",
    }),
)
