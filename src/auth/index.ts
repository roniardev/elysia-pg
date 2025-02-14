import { Elysia } from "elysia";
import { login } from "./usecase/login.usecase";
import { logout } from "./usecase/logout.usecase";
import { verifyJWT } from "./usecase/verify-jwt.usecase";
import { register } from "./usecase/register.usecase";
import { verifyEmail } from "./usecase/verify-email.usecase";
import { forgotPassword } from "./usecase/forgot-password.usecase";
import { resetPassword } from "./usecase/reset-password.usecase";

export const auth = new Elysia()
	.use(login)
	.use(logout)
	.use(verifyJWT)
	.use(register)
	.use(verifyEmail)
	.use(forgotPassword)
	.use(resetPassword);
