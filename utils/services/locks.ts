import { Verrou } from "@verrou/core";
import { memoryStore } from "@verrou/core/drivers/memory";
import { redisStore } from "@verrou/core/drivers/redis";
import { config } from "../config.ts";
import { redis } from "./redis.ts";

export const verrou = new Verrou({
	default: config.LOCK_STORE,
	stores: {
		memory: { driver: memoryStore() },
		redis: { driver: redisStore({ connection: redis }) },
	},
});
