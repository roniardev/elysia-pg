import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { permissions, posts, scopeUserPermissions, userPermissions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";
import { decryptResponse } from "@/utils/decrypt-response";
import Sorting from "@/common/enum/sorting";
import { faker } from "@faker-js/faker";
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

interface ReadAllPostsResponse {
    status: boolean;
    message: string;
    data: {
        data: Array<{
            id: string;
            userId: string;
            title: string;
            excerpt: string;
            content: string;
            status: "draft" | "published";
            visibility: "public" | "private";
            tags: string;
            user: {
                id: string;
            };
            createdAt: string;
        }>;
    };
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPage: number;
    };
}

describe("/post", () => {
    let accessToken: string;
    const userId = "1";
    const twelvePosts = Array.from({ length: 12 }, () => ({
        title: faker.lorem.sentence(10),
        excerpt: faker.lorem.sentence(10),
        content: faker.lorem.paragraph(10),
        status: faker.helpers.arrayElement(["draft", "published"]),
        visibility: faker.helpers.arrayElement(["public", "private"]),
    }));

    beforeAll(async () => {
        // Create a test user
        await db.insert(users).values({
            id: userId,
            email: "test@test.com",
            hashedPassword: await Bun.password.hash("password"),
            emailVerified: true,
        });

        // First ensure the permission exists
        const readAllPermission = await db.query.permissions.findFirst({
            where: (table, { eq }) => eq(table.name, "read-all:post")
        });
        
        if (!readAllPermission) {
            throw new Error("Read-all permission not found in database");
        }
        const userPermissionId = ulid();
        // Create user permission
        await db.insert(userPermissions).values({
            id: userPermissionId,
            userId: userId,
            permissionId: readAllPermission.id,
        });

        await db.insert(scopeUserPermissions).values({
            id: ulid(),
            userPermissionId: userPermissionId,
            scopeId: '01JMBBHZS7DTAC9DRT5PQP03VK',
        });

        // Create test posts
        for (const post of twelvePosts) {
            await db.insert(posts).values({
                id: ulid(),
                userId: userId,
                ...post
            });
        }

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
        const response = await fetch(`${API_URL}/post?page=1&limit=10`, {
            method: "GET",
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
    });

    it("should return all posts with pagination", async () => {
        const response = await fetch(`${API_URL}/post?page=1&limit=2`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as ReadAllPostsResponse;
        const decryptedJson = decryptResponse(json.data as unknown as string) as any;

        const userPermission = await db.query.userPermissions.findFirst({
            where: (table, { eq }) => eq(table.userId, userId)
        });

        if (userPermission) {
            await db.delete(scopeUserPermissions).where(eq(scopeUserPermissions.userPermissionId, userPermission.id));
        }

        console.log({
            DCP: decryptedJson
        })
        
        expect(json.status).toBe(true);
        expect(json.message).toBe(SuccessMessage.POSTS_FETCHED);
        expect(decryptedJson.meta.total).toBe(12);
        expect(decryptedJson.meta.page).toBe(1);
        expect(decryptedJson.meta.limit).toBe(2);
        expect(decryptedJson.meta.totalPage).toBe(6);
    });

    it("should return posts sorted in ascending order", async () => {
        const response = await fetch(`${API_URL}/post?page=1&limit=10&sort=${Sorting.ASC}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as ReadAllPostsResponse;
        const decryptedJson = decryptResponse(json.data as unknown as string) as any;
        
        expect(json.status).toBe(true);
        expect(decryptedJson.data.length).toBe(10);
        // Verify ascending order by checking first and last posts
        expect(decryptedJson.data[0].createdAt < decryptedJson.data[9].createdAt).toBe(true);
    });

    it("should return filtered posts by search term", async () => {
        const response = await fetch(`${API_URL}/post?page=1&limit=10&search=${twelvePosts[1]?.title}`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as ReadAllPostsResponse;
        const decryptedJson = decryptResponse(json.data as unknown as string) as any;
        
        expect(json.status).toBe(true);
        expect(decryptedJson.data.length).toBe(1);
        expect(decryptedJson.data[0].title).toBe(twelvePosts[1]?.title as string);
    });

    it("should return error for invalid page number", async () => {
        const response = await fetch(`${API_URL}/post?page=999&limit=10`, {
            method: "GET",
            headers: { 
                "Authorization": `Bearer ${accessToken}`
            },
        });

        const json = (await response.json()) as ErrorResponse;
        expect(json.status).toBe(false);
        expect(json.message).toBe(ErrorMessage.PAGE_NOT_FOUND);
    });

    afterAll(async () => {
        // Clean up test data
        await redis.del(`${userId}:refreshToken`);
        await redis.del(`${userId}:accessToken`);
        
        const readAllPermission = await db.query.permissions.findFirst({
            where: (table, { eq }) => eq(table.name, "read-all:post")
        });
        
        if (readAllPermission) {
            await db.delete(userPermissions).where(
                and(
                    eq(userPermissions.userId, userId),
                    eq(userPermissions.permissionId, readAllPermission.id)
                )
            );
        }
        
        await db.delete(posts).where(eq(posts.userId, userId));
        await db.delete(users).where(eq(users.id, userId));
    });
}); 