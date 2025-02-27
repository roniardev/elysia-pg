import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";

const API_URL = `${config.API_URL}:${config.PORT}`;

describe("/regenerate-access-token", () => {
	let refreshToken = "";

	beforeAll(async () => {
		await db.insert(users).values({
			id: "1",
			email: "test@test.com",
			hashedPassword: await Bun.password.hash("password"),
			emailVerified: true,
		});

		const login = await fetch(`${API_URL}/login`, {
			method: "POST",
			body: JSON.stringify({ email: "test@test.com", password: "password" }),
			headers: { "Content-Type": "application/json" },
		});

		const loginJson = (await login.json()) as {
			status: boolean;
			message: string;
			data: {
				accessToken: string;
				refreshToken: string;
			};
		};

		refreshToken = loginJson.data.refreshToken;
	});

	it("return a Invalid credentials", async () => {
		const response = await fetch(`${API_URL}/regenerate-access-token`, {
			method: "GET",
			headers: {
				Authorization: "Bearer invalidRefreshToken",
				"Content-Type": "application/json",
			},
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
	});

	it("return a Valid access token", async () => {
		const response = await fetch(`${API_URL}/regenerate-access-token`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${refreshToken}`,
			},
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
			accessToken: string;
			refreshToken: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe(SuccessMessage.ACCESS_TOKEN_REGENERATED);
	});

	afterAll(async () => {
		await redis.del("1:refreshToken");
		await redis.del("1:accessToken");
		await db.delete(users).where(eq(users.id, "1"));
	});
});