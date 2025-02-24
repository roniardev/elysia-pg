import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";

describe("/forgot-password", () => {
	beforeAll(async () => {
		await db.insert(users).values({
			id: "1",
			email: "test@test.com",
			hashedPassword: await Bun.password.hash("password"),
			emailVerified: true,
		});
	});

	it("return a Invalid email", async () => {
		const response = await fetch("http://localhost:3000/forgot-password", {
			method: "POST",
			body: JSON.stringify({ email: "invalid@email.com" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe("User not found");
	});

	it("return a Email sent successfully", async () => {
		const response = await fetch("http://localhost:3000/forgot-password", {
			method: "POST",
			body: JSON.stringify({ email: "test@test.com" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe(
			"Email sent, please check your email for the reset password link",
		);
	});

	afterAll(async () => {
		await db
			.delete(passwordResetTokens)
			.where(eq(passwordResetTokens.userId, "1"));
		await db.delete(users).where(eq(users.id, "1"));
	});
});