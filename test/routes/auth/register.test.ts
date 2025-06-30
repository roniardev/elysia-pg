import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";

const API_URL = `${config.API_URL}:${config.PORT}`;

describe("/register", () => {
	beforeAll(async () => {
		await db.insert(users).values({
			id: "1",
			email: "test@test.com",
			hashedPassword: await Bun.password.hash("password"),
			emailVerified: true,
		});
	});

	it("return a Invalid email.", async () => {
		const response = await fetch(`${API_URL}/register`, {
			method: "POST",
			body: JSON.stringify({
				email: "invalidemail",
				password: "apaan",
				confirmPassword: "apaan",
			}),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe(ErrorMessage.INVALID_EMAIL);
	});

	it("return a Password and confirm password do not match", async () => {
		const response = await fetch(`${API_URL}/register`, {
			method: "POST",
			body: JSON.stringify({
				email: "test@test.com",
				password: "apaan",
				confirmPassword: "apaan2",
			}),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe(ErrorMessage.PASSWORD_DO_NOT_MATCH);
	});

	it("return a User already exists", async () => {
		const response = await fetch(`${API_URL}/register`, {
			method: "POST",
			body: JSON.stringify({
				email: "test@test.com",
				password: "apaan",
				confirmPassword: "apaan",
			}),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(false);
		expect(json.message).toBe(ErrorMessage.USER_ALREADY_EXISTS);
	});

	it("return a User registered successfully", async () => {
		const response = await fetch(`${API_URL}/register`, {
			method: "POST",
			body: JSON.stringify({
				email: "test2@test.com",
				password: "apaan",
				confirmPassword: "apaan",
			}),
			headers: { "Content-Type": "application/json" },
		});

		console.log(response)

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe(SuccessMessage.USER_REGISTERED);

		const user = await db.query.users.findFirst({
			where: (table, { eq: eqFn }) => {
				return eqFn(table.email, "test2@test.com");
			},
		});

		expect(user).toBeDefined();
		expect(user?.email).toBe("test2@test.com");
		expect(user?.hashedPassword).toBeDefined();
		expect(user?.emailVerified).toBe(false);
	});

	afterAll(async () => {
		await redis.del("1:refreshToken");
		await redis.del("1:accessToken");
		await db.delete(users).where(eq(users.id, "1"));
		await db
			.delete(emailVerificationTokens)
			.where(eq(emailVerificationTokens.email, "test2@test.com"));
		await db.delete(users).where(eq(users.email, "test2@test.com"));
	});
});
