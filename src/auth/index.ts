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

export const auth = new Elysia()
    .use(
        rateLimit({
            max:
                config.NODE_ENV === "test" || config.NODE_ENV === "development"
                    ? 10000
                    : 100,
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
