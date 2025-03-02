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

interface ReadPostResponse {
    status: boolean;
    message: string;
    data: {
        id: string;
        userId: string;
        title: string;
        excerpt: string;
        content: string;
        status: "draft" | "published";
        visibility: "public" | "private";
        tags: string;
    };
}

describe("/post/:id", () => {
    let accessToken: string;
    let postId: string;
    const userId = "1";
    const postData = {
        title: "Test Post",
        excerpt: "Test Excerpt",
        content: "Test Content",
        status: "draft" as const,
        visibility: "private" as const,
        tags: JSON.stringify(["test"])
    };

    beforeAll(async () => {
        // Create a test user
        await db.insert(users).values({
            id: userId,
            email: "test@test.com",
            hashedPassword: await Bun.password.hash("password"),
            emailVerified: true,
        });

        // First ensure the permission exists
        const readPermission = await db.query.permissions.findFirst({
            where: (table, { eq }) => eq(table.name, "read:post")
        });
        
        if (!readPermission) {
            throw new Error("Read permission not found in database");
        }

        // Create user permission
        await db.insert(userPermissions).values({
            id: ulid(),
            userId: userId,
            permissionId: readPermission.id,
        });

        // Create a test post
        postId = ulid();
        await db.insert(posts).values({
            id: postId,
            userId: userId,
            ...postData
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
            method: "GET",
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
    });

    it("should return post not found for invalid post id", async () => {
        const invalidPostId = ulid();
        const response = await fetch(`${API_URL}/post/${invalidPostId}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.POST_NOT_FOUND);
    });

    it("should read post successfully", async () => {
        const response = await fetch(`${API_URL}/post/${postId}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as ReadPostResponse;
        const decryptJson = decryptResponse(json.data as unknown as string) as any;
        expect(json.status).toBe(true);
        expect(json.message).toBe(SuccessMessage.POST_READ);
        expect(decryptJson?.data?.content).toBe(postData.content);
        expect(decryptJson?.data?.status).toBe(postData.status);
        expect(decryptJson?.data?.visibility).toBe(postData.visibility);
        expect(decryptJson?.data?.tags).toBe(postData.tags);
    });

    afterAll(async () => {
        // Clean up test data
        await redis.del(`${userId}:refreshToken`);
        await redis.del(`${userId}:accessToken`);
        
        const readPermission = await db.query.permissions.findFirst({
            where: (table, { eq }) => eq(table.name, "read:post")
        });
        
        if (readPermission) {
            await db.delete(userPermissions).where(
                and(
                    eq(userPermissions.userId, userId),
                    eq(userPermissions.permissionId, readPermission.id)
                )
            );
        }
        
        await db.delete(posts).where(eq(posts.id, postId));
        await db.delete(users).where(eq(users.id, userId));
    });
}); 