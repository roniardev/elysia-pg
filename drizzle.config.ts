import type { Config } from "drizzle-kit";

export default {
	schema: "./db/schema",
	out: "./db/migrations",
	dialect: "postgresql",
	casing: "snake_case",
	dbCredentials: {
		url: process.env.DATABASE_URL as string,
	},
} satisfies Config;
