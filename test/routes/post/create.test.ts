import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { decryptResponse } from "@/utils/decrypt-response";
import { createTestUser, cleanupTestUser, loginTestUser } from "@/test/helpers/test-setup";

const API_URL = `${config.API_URL}:${config.PORT}`;

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
    let userId: string;
    let organizationId: string;

    beforeAll(async () => {
        // Create test user with create:post permission
        const testUser = await createTestUser({
            permissionIds: ["01JM71SE4T1709CSXCF4W3J3XR"], // create:post
        });

        userId = testUser.userId;
        organizationId = testUser.organizationId;

        // Login to get access token
        accessToken = await loginTestUser(testUser.email, testUser.password, API_URL);
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
        // Clean up test posts
        await db.delete(posts).where(eq(posts.userId, userId));

        // Clean up test user and organization
        await cleanupTestUser(userId, organizationId);
    });
});