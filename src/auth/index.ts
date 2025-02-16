import { Elysia } from "elysia";

import { login } from "./usecase/login";
import { logout } from "./usecase/logout";
import { register } from "./usecase/register";
import { verifyEmail } from "./usecase/verify-email";
import { forgotPassword } from "./usecase/forgot-password";
import { resetPassword } from "./usecase/reset-password.";
import { regenerateAccessToken } from "./usecase/regenerate-access-token.";

export const auth = new Elysia()
	.use(login)
	.use(logout)
	.use(register)
	.use(verifyEmail)
	.use(forgotPassword)
	.use(resetPassword)
	.use(regenerateAccessToken);
