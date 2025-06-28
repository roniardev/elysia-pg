import { Elysia } from "elysia"
import { rateLimit } from "elysia-rate-limit"

import { config } from "@/app/config"
import { forgotPassword } from "./usecase/forgot-password"
import { login } from "./usecase/login"
import { logout } from "./usecase/logout"
import { regenerateAccessToken } from "./usecase/regenerate-access-token."
import { register } from "./usecase/register"
import { resetPassword } from "./usecase/reset-password."
import { verifyEmail } from "./usecase/verify-email"

export const auth = new Elysia()
    .use(
        rateLimit({
            max: config.NODE_ENV === "test" ? 10000 : 100,
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
