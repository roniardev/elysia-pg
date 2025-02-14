import { createClient, type RedisClientType } from "redis";
import { config } from "@/app/config";
export const RedisClientConfig: RedisClientType = createClient({
	url: config.REDIS_URL,
});

export async function initializeRedisClient(): Promise<RedisClientType> {
	RedisClientConfig.on("error", (err: unknown) =>
		console.log("Redis Client Error", err),
	);
	RedisClientConfig.on("connect", () => console.log("Redis Client Connected"));

	await RedisClientConfig.connect();

	return RedisClientConfig;
}
