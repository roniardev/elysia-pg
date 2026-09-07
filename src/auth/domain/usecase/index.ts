import { forgotPasswordUsecase } from "./forgot_password_usecase"
import { loginUsecase } from "./login_usecase"
import { logoutUsecase } from "./logout_usecase"
import { regenerateAccessTokenUsecase } from "./regenerate_access_token_usecase"
import { registerUsecase } from "./register_usecase"
import { resetPasswordUsecase } from "./reset_password_usecase"
import { verifyEmailUsecase } from "./verify_email_usecase"

export const AuthUsecase = {
    forgotPassword: forgotPasswordUsecase,
    login: loginUsecase,
    logout: logoutUsecase,
    regenerateAccessToken: regenerateAccessTokenUsecase,
    register: registerUsecase,
    resetPassword: resetPasswordUsecase,
    verifyEmail: verifyEmailUsecase,
}
