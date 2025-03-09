import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { permissions, userPermissions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";
import { decryptResponse } from "@/utils/decrypt-response";
import { ManagePermission } from "@/common/enum/permissions";

const API_URL = `${config.API_URL}:${config.PORT}`;

// Static ULIDs for test
const CREATE_PERMISSION_ID = "01HQWXYZ0000000000000TEST";
const TEST_USER_ID = "01HQWXYZ1111111111111USER";
const TEST_PERMISSION_NAME = "TEST_PERMISSION";

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

interface CreatePermissionResponse {
  status: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    description: string | null;
  };
}

describe("/permission", () => {
  let accessToken: string;
  let createPermissionId: string;

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: "permission-test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    });

    // First ensure the permission exists
    let createPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, ManagePermission.CREATE_PERMISSION),
    });

    if (!createPermission) {
      // Create the permission if it doesn't exist
      createPermissionId = CREATE_PERMISSION_ID;
      await db.insert(permissions).values({
        id: createPermissionId,
        name: ManagePermission.CREATE_PERMISSION,
        description: "Permission to create permissions",
      });
    } else {
      createPermissionId = createPermission.id;
    }

    // Assign permission to user
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: TEST_USER_ID,
      permissionId: createPermissionId,
      revoked: false,
    });

    // Login to get access token
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "permission-test@test.com",
        password: "password",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const loginJson = (await loginResponse.json()) as LoginResponse;
    accessToken = loginJson.data.accessToken;
  });

  it("should return unauthorized when no token provided", async () => {
    const response = await fetch(`${API_URL}/permission`, {
      method: "POST",
      body: JSON.stringify({
        name: TEST_PERMISSION_NAME,
        description: "Test permission description",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
  });

  it("should create a permission successfully", async () => {
    const permissionData = {
      name: TEST_PERMISSION_NAME,
      description: "Test permission description",
    };

    const response = await fetch(`${API_URL}/permission`, {
      method: "POST",
      body: JSON.stringify(permissionData),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as CreatePermissionResponse;
    const decryptedJson = decryptResponse(json.data as unknown as string);
    expect(json?.status).toBe(true);
    expect(json?.message).toBe(SuccessMessage.PERMISSION_CREATED);
    expect(decryptedJson?.data).toHaveProperty("id");
    expect(decryptedJson?.data.name).toBe(permissionData.name);
    expect(decryptedJson?.data.description).toBe(permissionData.description);
  });

  afterAll(async () => {
    // Clean up test data
    await redis.del(`${TEST_USER_ID}:refreshToken`);
    await redis.del(`${TEST_USER_ID}:accessToken`);
    
    // Delete test permission
    const testPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, TEST_PERMISSION_NAME),
    });
    
    if (testPermission) {
      await db.delete(permissions).where(eq(permissions.id, testPermission.id));
    }

    // Delete user permission
				await db
					.delete(userPermissions)
					.where(
						and(
							eq(userPermissions.userId, TEST_USER_ID),
							eq(userPermissions.permissionId, createPermissionId),
						),
					);

    await db.delete(permissions).where(eq(permissions.id, createPermissionId));

    
    // Delete test user
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
  });
}); 