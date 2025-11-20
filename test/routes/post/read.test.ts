import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";
import { decryptResponse } from "@/utils/decrypt-response";
import { createTestUser, cleanupTestUser, loginTestUser } from "@/test/helpers/test-setup";

const API_URL = `${config.API_URL}:${config.PORT}`;

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
    let userId: string;
    let organizationId: string;
    const postData = {
        title: "Test Post",
        excerpt: "Test Excerpt",
        content: "Test Content",
        status: "draft" as const,
        visibility: "private" as const,
        tags: JSON.stringify(["test"])
    };

    beforeAll(async () => {
        // Create test user with read:post permission
        const readPermission = await db.query.permissions.findFirst({
            where: (table, { eq }) => eq(table.name, "read:post")
        });

        if (!readPermission) {
            throw new Error("Read permission not found in database");
        }

        const testUser = await createTestUser({
            permissionIds: [readPermission.id],
        });

        userId = testUser.userId;
        organizationId = testUser.organizationId;

        // Create a test post
        postId = ulid();
        await db.insert(posts).values({
            id: postId,
            userId: userId,
            organizationId: organizationId,
            ...postData
        });

        // Login to get access token
        accessToken = await loginTestUser(testUser.email, testUser.password, API_URL);
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
        await db.delete(posts).where(eq(posts.id, postId));
        await cleanupTestUser(userId, organizationId);
    });
});
