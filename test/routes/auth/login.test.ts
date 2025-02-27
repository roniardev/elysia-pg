import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";

const API_URL = `${config.API_URL}:${config.PORT}`;

describe("/login", () => {
	beforeAll(async () => {
		await db.insert(users).values({
			id: "1",
			email: "test@test.com",
			hashedPassword: await Bun.password.hash("password"),
			emailVerified: true,
		});
	});

	it("return a Invalid credentials", async () => {
		const response = await fetch(`${API_URL}/login`, {
			method: "POST",
			body: JSON.stringify({
				email: "invalid@email.com",
				password: "apaan",
			}),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe(ErrorMessage.INVALID_CREDENTIALS);
	});

	it("return email not verified", async () => {
		await db
			.update(users)
			.set({ emailVerified: false })
			.where(eq(users.id, "1"));
		const response = await fetch(`${API_URL}/login`, {
			method: "POST",
			body: JSON.stringify({ email: "test@test.com", password: "password" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe(ErrorMessage.EMAIL_NOT_VERIFIED);
	});

	it("return valid credentials", async () => {
		await db
			.update(users)
			.set({ emailVerified: true })
			.where(eq(users.id, "1"));

		const response = await fetch(`${API_URL}/login`, {
			method: "POST",
			body: JSON.stringify({ email: "test@test.com", password: "password" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe(SuccessMessage.LOGIN_SUCCESS);
	});

	afterAll(async () => {
		await redis.del("1:refreshToken");
		await redis.del("1:accessToken");
		await db.delete(users).where(eq(users.id, "1"));
	});
}); 
