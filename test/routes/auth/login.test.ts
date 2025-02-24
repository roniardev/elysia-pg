import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";

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
		const response = await fetch("http://localhost:3000/login", {
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
		expect(json.message).toBe("Invalid credentials.");
	});

	it("return email not verified", async () => {
		await db
			.update(users)
			.set({ emailVerified: false })
			.where(eq(users.id, "1"));
		const response = await fetch("http://localhost:3000/login", {
			method: "POST",
			body: JSON.stringify({ email: "test@test.com", password: "password" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe("Email not verified.");
	});

	it("return valid credentials", async () => {
		await db
			.update(users)
			.set({ emailVerified: true })
			.where(eq(users.id, "1"));

		const response = await fetch("http://localhost:3000/login", {
			method: "POST",
			body: JSON.stringify({ email: "test@test.com", password: "password" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe("Login successful.");
	});

	afterAll(async () => {
		await redis.del("1:refreshToken");
		await redis.del("1:accessToken");
		await db.delete(users).where(eq(users.id, "1"));
	});
}); 
