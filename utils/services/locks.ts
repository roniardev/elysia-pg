import { Verrou } from "@verrou/core";
import { memoryStore } from "@verrou/core/drivers/memory";
import { redisStore } from "@verrou/core/drivers/redis";
import { redis } from "./redis";

export const verrou = new Verrou({
	default: "redis",
	stores: {
		memory: { driver: memoryStore() },
		redis: { driver: redisStore({ connection: redis }) },
	},
});
