import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { permissions, posts, userPermissions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";

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

interface DeletePostResponse {
    status: boolean;
    message: string;
}

describe("/post/:id", () => {
    let accessToken: string;
    let postId: string;
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
            permissionId: "01JM71SE4TD9GTGVBZ6TK8GE6A",
        });

        // Create a test post
        postId = ulid();
        await db.insert(posts).values({
            id: postId,
            userId: userId,
            title: "Test Post",
            excerpt: "Test Excerpt",
            content: "Test Content",
            status: "draft",
            visibility: "private",
            tags: JSON.stringify(["test"]),
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
        const response = await fetch(`${API_URL}/post/${postId}`, {
            method: "DELETE",
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
    });

    it("should return post not found for invalid post id", async () => {
        const invalidPostId = ulid();
        const response = await fetch(`${API_URL}/post/${invalidPostId}`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.POST_NOT_FOUND);
    });

    it("should delete post successfully", async () => {
        const response = await fetch(`${API_URL}/post/${postId}`, {
            method: "DELETE",
            headers: { 
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as DeletePostResponse;
        expect(json.status).toBe(true);
        expect(json.message).toBe(SuccessMessage.POST_DELETED);

        // Verify post was deleted from database
        const deletedPost = await db.query.posts.findFirst({
            where: (table, { eq }) => eq(table.id, postId),
        });

        expect(deletedPost).toBeUndefined();
    });

    afterAll(async () => {
        // Clean up test data
        await redis.del(`${userId}:refreshToken`);
        await redis.del(`${userId}:accessToken`);
        await db.delete(userPermissions).where(and(eq(userPermissions.userId, userId), eq(userPermissions.permissionId, "01JM71SE4TD9GTGVBZ6TK8GE6A")));
        await db.delete(posts).where(eq(posts.id, postId));
        await db.delete(users).where(eq(users.id, userId));
    });
}); 