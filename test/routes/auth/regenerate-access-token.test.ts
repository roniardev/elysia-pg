import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";

describe("/regenerate-access-token", () => {
	let accessToken = "";

	beforeAll(async () => {
		await db.insert(users).values({
			id: "1",
			email: "test@test.com",
			hashedPassword: await Bun.password.hash("password"),
			emailVerified: true,
		});

		const login = await fetch("http://localhost:3000/login", {
			method: "POST",
			body: JSON.stringify({ email: "test@test.com", password: "password" }),
			headers: { "Content-Type": "application/json" },
		});

		const loginJson = (await login.json()) as {
			status: boolean;
			message: string;
			accessToken: string;
		};

		accessToken = loginJson.accessToken;
	});

	it("return a Invalid credentials", async () => {
		const response = await fetch(
			"http://localhost:3000/regenerate-access-token",
			{
				method: "GET",
				headers: {
					Authorization: "Bearer invalidRefreshToken",
					"Content-Type": "application/json",
				},
			},
		);

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe("Unauthorized");
	});

	it("return a Valid access token", async () => {
		const response = await fetch(
			"http://localhost:3000/regenerate-access-token",
			{
				method: "GET",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			},
		);

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe("Access token regenerated successfully.");
	});

	afterAll(async () => {
		await redis.del("1:refreshToken");
		await redis.del("1:accessToken");
		await db.delete(users).where(eq(users.id, "1"));
	});
});