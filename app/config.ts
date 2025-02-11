import env from "env-var";

export const config = {
	NODE_ENV: env
		.get("NODE_ENV")
		.default("development")
		.asEnum(["production", "test", "development"]),

	PORT: env.get("PORT").default(3000).asPortNumber(),
	API_URL: env
		.get("API_URL")
		.default(`https://${env.get("PUBLIC_DOMAIN").asString()}`)
		.asString(),
	DATABASE_URL: env.get("DATABASE_URL").required().asString(),
	REDIS_HOST: env.get("REDIS_HOST").default("localhost").asString(),
	LOCK_STORE: env
		.get("LOCK_STORE")
		.default("redis")
		.asEnum(["memory", "redis"]),
	JWT_ACCESS_SECRET: env.get("JWT_ACCESS_SECRET").required().asString(),
	JWT_REFRESH_SECRET: env.get("JWT_REFRESH_SECRET").required().asString(),
	SECRET_KEY: env.get("SECRET_KEY").required().asString(),
};
