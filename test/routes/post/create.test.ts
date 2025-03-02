import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { permissions, posts, userPermissions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";
import { decryptResponse } from "@/utils/decrypt-response";
const API_URL = `${config.API_URL}:${config.PORT}`;

interface LoginResponse {
    status: boolean;
    message: string;
    data: {
        accessToken: string;
    };
}

interface ErrorResponse {
    status: boolean;
    message: string;
}

interface CreatePostResponse {
    status: boolean;
    message: string;
    data: {
        id: string;
        title: string;
        excerpt: string;
        content: string;
    };
}

describe("/post", () => {
    let accessToken: string;
    const userId = "1";

    beforeAll(async () => {
        // Create a test user
        await db.insert(users).values({
            id: userId,
            email: "test@test.com",
            hashedPassword: await Bun.password.hash("password"),
            emailVerified: true,
        });

        await db.insert(userPermissions).values({
            id: ulid(),
            userId: userId,
            permissionId: "01JM71SE4T1709CSXCF4W3J3XR",
        });

        // Login to get access token
        const loginResponse = await fetch(`${API_URL}/login`, {
            method: "POST",
            body: JSON.stringify({
                email: "test@test.com",
                password: "password",
            }),
            headers: { "Content-Type": "application/json" },
        });

        const loginJson = (await loginResponse.json()) as LoginResponse;
        accessToken = loginJson.data.accessToken;
    });

    it("should return unauthorized when no token provided", async () => {
        const response = await fetch(`${API_URL}/post`, {
            method: "POST",
            body: JSON.stringify({
                title: "Test Post unauthorized",
                excerpt: "Test Excerpt unauthorized",
                content: "Test Content unauthorized",
            }),
            headers: { "Content-Type": "application/json" },
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
    });

    it("should create a post successfully", async () => {
        const postData = {
            title: "Test Post",
            excerpt: "Test Excerpt",
            content: "Test Content",
        };

        const response = await fetch(`${API_URL}/post`, {
            method: "POST",
            body: JSON.stringify(postData),
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as CreatePostResponse;
        const decryptedJson = decryptResponse(json.data as unknown as string);
        expect(json?.status).toBe(true);
        expect(json?.message).toBe(SuccessMessage.POST_CREATED);
        expect(decryptedJson?.data).toHaveProperty("id");
        expect(decryptedJson?.data.title).toBe(postData.title);
        expect(decryptedJson?.data.excerpt).toBe(postData.excerpt);
        expect(decryptedJson?.data.content).toBe(postData.content);    
    });

    afterAll(async () => {
        // Clean up test data
        await redis.del(`${userId}:refreshToken`);
        await redis.del(`${userId}:accessToken`);
        await db.delete(userPermissions).where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionId, "01JM71SE4T1709CSXCF4W3J3XR")));
        await db.delete(posts).where(eq(posts.userId, userId));
        await db.delete(users).where(eq(users.id, userId));
    });
}); 