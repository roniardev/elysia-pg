import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";
import { createTestUser, cleanupTestUser, loginTestUser } from "@/test/helpers/test-setup";

const API_URL = `${config.API_URL}:${config.PORT}`;

type PostStatus = "draft" | "published";
type PostVisibility = "public" | "private";

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

interface UpdatePostResponse {
    status: boolean;
    message: string;
}

interface PostData {
    id: string;
    userId: string;
    organizationId: string;
    title: string;
    excerpt: string;
    content: string;
    status: PostStatus;
    visibility: PostVisibility;
    tags: string;
}

describe("/post/:id", () => {
    let accessToken: string;
    let postId: string;
    let userId: string;
    let organizationId: string;

    beforeAll(async () => {
        // Create test user with update:post permission
        const updatePermission = await db.query.permissions.findFirst({
            where: (table, { eq }) => eq(table.name, "update:post")
        });

        if (!updatePermission) {
            throw new Error("Update permission not found in database");
        }

        const testUser = await createTestUser({
            permissionIds: [updatePermission.id],
        });

        userId = testUser.userId;
        organizationId = testUser.organizationId;

        // Create a test post
        postId = ulid();
        const initialPost: PostData = {
            id: postId,
            userId: userId,
            organizationId: organizationId,
            title: "Original Title",
            excerpt: "Original Excerpt",
            content: "Original Content",
            status: "draft",
            visibility: "private",
            tags: JSON.stringify(["test"]),
        };

        await db.insert(posts).values(initialPost);

        // Login to get access token
        accessToken = await loginTestUser(testUser.email, testUser.password, API_URL);
    });

    it("should return unauthorized when no token provided", async () => {
        const response = await fetch(`${API_URL}/post/${postId}`, {
            method: "PUT",
            body: JSON.stringify({
                title: "Updated Title",
            }),
            headers: { "Content-Type": "application/json" },
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
    });

    it("should return post not found for invalid post id", async () => {
        const invalidPostId = ulid();
        const response = await fetch(`${API_URL}/post/${invalidPostId}`, {
            method: "PUT",
            body: JSON.stringify({
                title: "Updated Title",
            }),
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.POST_NOT_FOUND);
    });

    it("should update post successfully with partial data", async () => {
        const updateData = {
            title: "Updated Title",
            status: "published" as PostStatus,
        };

        const response = await fetch(`${API_URL}/post/${postId}`, {
            method: "PUT",
            body: JSON.stringify(updateData),
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as UpdatePostResponse;
        expect(json.status).toBe(true);
        expect(json.message).toBe(SuccessMessage.POST_UPDATED);

        // Verify post was updated in database
        const updatedPost = await db.query.posts.findFirst({
            where: (table, { eq }) => eq(table.id, postId),
        });

        expect(updatedPost).toBeDefined();
        expect(updatedPost?.title).toBe(updateData.title);
        expect(updatedPost?.status).toBe(updateData.status);
        // Original fields should remain unchanged
        expect(updatedPost?.excerpt).toBe("Original Excerpt");
        expect(updatedPost?.content).toBe("Original Content");
    });

    it("should update post successfully with all fields", async () => {
        const updateData = {
            title: "Completely Updated Title",
            excerpt: "Updated Excerpt",
            content: "Updated Content",
            status: "published" as PostStatus,
            visibility: "public" as PostVisibility,
            tags: JSON.stringify(["updated", "test"]),
        };

        const response = await fetch(`${API_URL}/post/${postId}`, {
            method: "PUT",
            body: JSON.stringify(updateData),
            headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as UpdatePostResponse;
        expect(json.status).toBe(true);
        expect(json.message).toBe(SuccessMessage.POST_UPDATED);

        // Verify all fields were updated in database
        const updatedPost = await db.query.posts.findFirst({
            where: (table, { eq }) => eq(table.id, postId),
        });

        expect(updatedPost).toBeDefined();
        expect(updatedPost?.title).toBe(updateData.title);
        expect(updatedPost?.excerpt).toBe(updateData.excerpt);
        expect(updatedPost?.content).toBe(updateData.content);
        expect(updatedPost?.status).toBe(updateData.status);
        expect(updatedPost?.visibility).toBe(updateData.visibility);
        expect(updatedPost?.tags).toBe(updateData.tags);
    });

    afterAll(async () => {
        // Clean up test data
        await db.delete(posts).where(eq(posts.id, postId));
        await cleanupTestUser(userId, organizationId);
    });
}); 