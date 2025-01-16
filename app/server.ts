import { bearer } from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { login } from "@/src/auth/usecase/login.usecase.ts";
import { Logestic } from "logestic";
import { rateLimit } from "elysia-rate-limit";
import { logout } from "@/src/auth/usecase/logout.usecase.ts";

export const app = new Elysia()
	.use(Logestic.preset("fancy"))
	.use(
		rateLimit({
			max: 10,
			duration: 60000,
		}),
	)
	.use(swagger())
	.use(bearer())
	.use(cors())
	.use(serverTiming())
	.use(login)
	.use(logout);

export type ElysiaApp = typeof app;
