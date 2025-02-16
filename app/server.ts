import { bearer } from "@elysiajs/bearer";
import { cors } from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { Logestic } from "logestic";
import { rateLimit } from "elysia-rate-limit";
import { posts } from "@/src/posts";
import { auth } from "@/src/auth";
import { initializeRedisClient } from "@/utils/services/redis";

export const app = new Elysia()
	.use(Logestic.preset("fancy"))
	.use(swagger())
	.use(cors())
	.use(serverTiming())
	.use(auth)
	.use(posts)
	.onError(({ error, code, set }) => {
		switch (code) {
			case "VALIDATION": {
				const resError = error.all as unknown as Array<
					Record<string, string | number>
				>;
				const name = error.all[0] as unknown as Record<string, string>;

				const errorType = name.type;

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
