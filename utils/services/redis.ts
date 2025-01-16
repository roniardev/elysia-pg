import { Redis } from "ioredis";
import { config } from "../config.ts";

export const redis = new Redis({
	host: config.REDIS_HOST,
	// for bullmq
	maxRetriesPerRequest: null,
});
