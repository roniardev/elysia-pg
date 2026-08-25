import { forgotPassword } from "@/src/auth/service/forgot-password"
import { login } from "@/src/auth/service/login"
import { logout } from "@/src/auth/service/logout"
import { regenerateAccessToken } from "@/src/auth/service/regenerate-access-token"
import { register } from "@/src/auth/service/register"
import { resetPassword } from "@/src/auth/service/reset-password"
import { verifyEmail } from "@/src/auth/service/verify-email"

export const AuthService = {
    register,
    login,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    regenerateAccessToken,
}
