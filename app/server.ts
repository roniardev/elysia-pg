import { Elysia } from "elysia";
import { Logestic } from "logestic";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";

import { config } from "./config";

import { posts } from "@/src/posts";
import { auth } from "@/src/auth";
import { users } from "@/src/users";
import { permissions } from "@/src/permissions";

export const app = new Elysia({
	serve: {
		idleTimeout: 255,
		maxRequestBodySize: 1024 * 1024 * 10, // 10MB,
		development: config.NODE_ENV === "development",
	},
})
	.use(Logestic.preset("fancy"))
	.use(swagger())
	.use(
		cors({
			origin: config.CORS_ORIGIN.split(","),
		}),
	)
	.use(serverTiming())
	.use(auth)
	.use(posts)
	.use(users)
	.use(permissions)
	.onError(({ error, code, set }) => {
		switch (code) {
			case "VALIDATION": {
				const resError = error.all as unknown as Array<
					Record<string, string | number>
				>;

				const err = resError.filter(
					(err) =>
						(Number(err?.type) || 0) >= 40 &&
						(Number(err?.type) || 0) < 50 &&
						err?.type,
				);
				set.status = 400;
				return {
					data: err,
				};
			}
		}
	});

export type ElysiaApp = typeof app;
