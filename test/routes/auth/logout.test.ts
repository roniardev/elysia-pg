import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

describe("/logout", () => {
	let accessToken: string;
	beforeAll(async () => {
		await db.insert(users).values({
			id: "1",
			email: "test@test.com",
			hashedPassword: await Bun.password.hash("password"),
			emailVerified: true,
		});
		const response = await fetch("http://localhost:3000/login", {
			method: "POST",
			body: JSON.stringify({
				email: "test@test.com",
				password: "password",
			}),
			headers: { "Content-Type": "application/json" },
		});
		const json = (await response.json()) as {
			status: boolean;
			message: string;
			accessToken: string;
			refreshToken: string;
		};
		accessToken = json.accessToken;
	});

	it("return a Unauthorized", async () => {
		const response = await fetch("http://localhost:3000/logout", {
			method: "POST",
			headers: {
				Authorization: "Bearer invalid",
			},
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe("Unauthorized");
	});

	it("return a Logged out successfully.", async () => {
		const response = await fetch("http://localhost:3000/logout", {
			method: "POST",
			headers: { Authorization: `Bearer ${accessToken}` },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe("Logged out successfully.");
	});

	afterAll(async () => {
		await db.delete(users).where(eq(users.id, "1"));
	});
}); 
