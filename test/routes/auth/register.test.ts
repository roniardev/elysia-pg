import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { emailVerificationTokens, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";

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
		const response = await fetch("http://localhost:3000/register", {
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
		expect(json.message).toBe("Invalid email.");
	});

	it("return a Password and confirm password do not match", async () => {
		const response = await fetch("http://localhost:3000/register", {
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
		expect(json.message).toBe("Password and confirm password do not match");
	});

	it("return a User already exists", async () => {
		const response = await fetch("http://localhost:3000/register", {
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
		expect(json.message).toBe("User already exists");
	});

	it("return a User registered successfully", async () => {
		const response = await fetch("http://localhost:3000/register", {
			method: "POST",
			body: JSON.stringify({
				email: "test2@test.com",
				password: "apaan",
				confirmPassword: "apaan",
			}),
			headers: { "Content-Type": "application/json" },
		});

		const json = (await response.json()) as {
			status: boolean;
			message: string;
		};

		expect(json.status).toBe(true);
		expect(json.message).toBe(
			"User registered successfully, please verify your email",
		);

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
