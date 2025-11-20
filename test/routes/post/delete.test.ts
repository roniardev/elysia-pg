import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";
import { createTestUser, cleanupTestUser, loginTestUser } from "@/test/helpers/test-setup";

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
    let userId: string;
    let organizationId: string;

    beforeAll(async () => {
        // Create test user with delete:post permission
        const deletePermission = await db.query.permissions.findFirst({
            where: (table, { eq }) => eq(table.name, "delete:post")
        });

        if (!deletePermission) {
            throw new Error("Delete permission not found in database");
        }

        const testUser = await createTestUser({
            permissionIds: [deletePermission.id],
        });

        userId = testUser.userId;
        organizationId = testUser.organizationId;

        // Create a test post
        postId = ulid();
        await db.insert(posts).values({
            id: postId,
            userId: userId,
            organizationId: organizationId,
            title: "Test Post",
            excerpt: "Test Excerpt",
            content: "Test Content",
            status: "draft",
            visibility: "private",
            tags: JSON.stringify(["test"]),
        });

        // Login to get access token
        accessToken = await loginTestUser(testUser.email, testUser.password, API_URL);
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
        // Clean up test data (post is already deleted by the test)
        await cleanupTestUser(userId, organizationId);
    });
}); 