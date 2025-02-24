import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import { login } from "./usecase/login";
import { logout } from "./usecase/logout";
import { register } from "./usecase/register";
import { verifyEmail } from "./usecase/verify-email";
import { forgotPassword } from "./usecase/forgot-password";
import { resetPassword } from "./usecase/reset-password.";
import { regenerateAccessToken } from "./usecase/regenerate-access-token.";
import { config } from "@/app/config";

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
	.use(regenerateAccessToken);
