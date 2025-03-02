import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { permissions, userPermissions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";
import { decryptResponse } from "@/utils/decrypt-response";
import { PermissionPermission } from "@/common/enum/permissions";

const API_URL = `${config.API_URL}:${config.PORT}`;

// Static ULIDs for test
const READ_PERMISSION_ID = "01HQWXYZ2222222222222TEST";
const TEST_PERMISSION_ID = "01HQWXYZ3333333333333PERM";
const TEST_USER_ID = "01HQWXYZ4444444444444USER";
const TEST_PERMISSION_NAME = "TEST_READ_PERMISSION";

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

interface ReadPermissionResponse {
  status: boolean;
  message: string;
  data: Array<{
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string | null;
  }>;
}

describe("/permission/:id", () => {
  let accessToken: string;
  let readPermissionId: string;

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: "permission-read-test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    });

    // First ensure the read permission exists
    let readPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, PermissionPermission.READ_PERMISSION),
    });

    if (!readPermission) {
      // Create the permission if it doesn't exist
      readPermissionId = READ_PERMISSION_ID;
      await db.insert(permissions).values({
        id: readPermissionId,
        name: PermissionPermission.READ_PERMISSION,
        description: "Permission to read permissions",
      });
    } else {
      readPermissionId = readPermission.id;
    }

    // Create a test permission to read
    await db.insert(permissions).values({
      id: TEST_PERMISSION_ID,
      name: TEST_PERMISSION_NAME,
      description: "Test permission for reading",
    });

    // Assign permission to user
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: TEST_USER_ID,
      permissionId: readPermissionId,
      revoked: false,
    });

    // Login to get access token
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "permission-read-test@test.com",
        password: "password",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const loginJson = (await loginResponse.json()) as LoginResponse;
    accessToken = loginJson.data.accessToken;
  });

  it("should return unauthorized when no token provided", async () => {
    const response = await fetch(`${API_URL}/permission/${TEST_PERMISSION_ID}`, {
      method: "GET",
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
  });

  it("should return permission not found for invalid permission id", async () => {
    const invalidPermissionId = "01HQWXYZ9999999999999INVALID";
    const response = await fetch(`${API_URL}/permission/${invalidPermissionId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.PERMISSION_NOT_FOUND);
  });

  it("should read permission successfully", async () => {
    const response = await fetch(`${API_URL}/permission/${TEST_PERMISSION_ID}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as ReadPermissionResponse;
    const decryptJson = decryptResponse(json.data as unknown as string) as any;
    expect(json.status).toBe(true);
    expect(json.message).toBe(SuccessMessage.PERMISSION_READ);
    expect(decryptJson?.data[0]?.id).toBe(TEST_PERMISSION_ID);
    expect(decryptJson?.data[0]?.name).toBe(TEST_PERMISSION_NAME);
    expect(decryptJson?.data[0]?.description).toBe("Test permission for reading");
  });

  afterAll(async () => {
    // Clean up test data
    await redis.del(`${TEST_USER_ID}:refreshToken`);
    await redis.del(`${TEST_USER_ID}:accessToken`);

    // Delete test permission
    await db.delete(permissions).where(eq(permissions.id, TEST_PERMISSION_ID));

    // Delete user permission
    await db.delete(userPermissions).where(
      and(
        eq(userPermissions.userId, TEST_USER_ID),
        eq(userPermissions.permissionId, readPermissionId)
      )
    );

    // Delete test user
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
  });
}); 