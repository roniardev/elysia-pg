import env from "env-var"

export const config = {
    NODE_ENV: env
        .get("NODE_ENV")
        .default("development")
        .asEnum(["production", "test", "development"]),

    PORT: env.get("PORT").default(3000).asPortNumber(),
    IS_ENCRYPT_RESPONSE: env
        .get("IS_ENCRYPT_RESPONSE")
        .default("false")
        .asBool(),
    API_URL: env.get("API_URL").required().asString(),
    DATABASE_URL: env.get("DATABASE_URL").required().asString(),
    REDIS_HOST: env.get("REDIS_HOST").default("localhost").asString(),
    LOCK_STORE: env
        .get("LOCK_STORE")
        .default("redis")
        .asEnum(["memory", "redis"]),
    JWT_ACCESS_SECRET: env.get("JWT_ACCESS_SECRET").required().asString(),
    JWT_REFRESH_SECRET: env.get("JWT_REFRESH_SECRET").required().asString(),
    JWT_EMAIL_SECRET: env.get("JWT_EMAIL_SECRET").required().asString(),
    SECRET_KEY: env.get("SECRET_KEY").required().asString(),
    FRONTEND_URL: env.get("FRONTEND_URL").required().asString(),
    RESEND_API_KEY: env.get("RESEND_API_KEY").required().asString(),
    RESEND_FROM_EMAIL: env.get("RESEND_FROM_EMAIL").required().asString(),
    REDIS_URL: env.get("REDIS_URL").required().asString(),
    REFRESH_TOKEN_EXPIRE_TIME: env
        .get("REFRESH_TOKEN_EXPIRE_TIME")
        .default(60 * 60 * 24 * 1)
        .asInt(),
    ACCESS_TOKEN_EXPIRE_TIME: env
        .get("ACCESS_TOKEN_EXPIRE_TIME")
        .default(60 * 30)
        .asInt(),
    CORS_ORIGIN: env.get("CORS_ORIGIN").required().asString(),
}