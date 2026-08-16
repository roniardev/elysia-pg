import { Elysia } from "elysia"
import { rateLimit } from "elysia-rate-limit"

import { config } from "@/app/config"
import { forgotPassword } from "@/src/auth/usecase/forgot-password"
import { login } from "@/src/auth/usecase/login"
import { logout } from "@/src/auth/usecase/logout"
import { regenerateAccessToken } from "@/src/auth/usecase/regenerate-access-token."
import { register } from "@/src/auth/usecase/register"
import { resetPassword } from "@/src/auth/usecase/reset-password."
import { verifyEmail } from "@/src/auth/usecase/verify-email"

const IS_DEV_ENV =
    config.NODE_ENV === "test" || config.NODE_ENV === "development"

const RATE_LIMIT_MAX_MAP: Readonly<Record<string, number>> = {
    true: 10000,
    false: 100,
}

export const auth = new Elysia()
    .use(
        rateLimit({
            max: RATE_LIMIT_MAX_MAP[String(IS_DEV_ENV)] || 100,
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
