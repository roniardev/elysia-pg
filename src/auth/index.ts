import { Elysia } from "elysia"
import { rateLimit } from "elysia-rate-limit"

import { config } from "@/app/config"
import { forgotPassword } from "@/src/auth/delivery/presenter/http/forgot_password"
import { login } from "@/src/auth/delivery/presenter/http/login"
import { logout } from "@/src/auth/delivery/presenter/http/logout"
import { regenerateAccessToken } from "@/src/auth/delivery/presenter/http/regenerate_access_token"
import { register } from "@/src/auth/delivery/presenter/http/register"
import { resetPassword } from "@/src/auth/delivery/presenter/http/reset_password"
import { verifyEmail } from "@/src/auth/delivery/presenter/http/verify_email"

const RATE_LIMIT_MAX: Readonly<Record<string, number>> = {
    test: 10000,
    development: 10000,
    production: 100,
}

export const auth = new Elysia()
    .use(
        rateLimit({
            max: RATE_LIMIT_MAX[config.NODE_ENV] ?? 100,
            duration: 60000,
            scoping: "scoped",
        }),
    )
    .use(login)
    .use(logout)
    .use(register)
    .use(verifyEmail)
    .use(forgotPassword)
    .use(resetPassword)
    .use(regenerateAccessToken)
