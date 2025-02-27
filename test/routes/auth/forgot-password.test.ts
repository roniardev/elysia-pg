import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";

const API_URL = `${config.API_URL}:${config.PORT}`;

describe("/forgot-password", () => {
	beforeAll(async () => {
		await db.insert(users).values({
			id: "1",
			email: "test@test.com",
			hashedPassword: await Bun.password.hash("password"),
			emailVerified: true,
		});
	});

	it("return a User not found", async () => {
		const response = await fetch(`${API_URL}/forgot-password`, {
			method: "POST",
			body: JSON.stringify({ email: "invalid@email.com" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe(ErrorMessage.USER_NOT_FOUND);
	});

	it("return a Invalid email", async () => {
		const response = await fetch(`${API_URL}/forgot-password`, {
			method: "POST",
			body: JSON.stringify({ email: "invalidemail" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe(ErrorMessage.INVALID_EMAIL);
	});

	it("return a Email sent successfully", async () => {
		const response = await fetch(`${API_URL}/forgot-password`, {
			method: "POST",
			body: JSON.stringify({ email: "test@test.com" }),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe(SuccessMessage.EMAIL_SENT);
	});

	afterAll(async () => {
		await db
			.delete(passwordResetTokens)
			.where(eq(passwordResetTokens.userId, "1"));
		await db.delete(users).where(eq(users.id, "1"));
	});
});