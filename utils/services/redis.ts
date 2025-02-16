import { Redis, type RedisOptions } from "ioredis";
import { config } from "@/app/config";

export const redis = new Redis({
	host: config.REDIS_HOST,
	// for bullmq
	maxRetriesPerRequest: null,
});

export async function initializeRedisClient(): Promise<void> {
	redis.on("error", (err: unknown) => console.log("Redis Client Error", err));
	redis.on("connect", () => console.log("Redis Client Connected"));

	await redis.connect();
}
