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
const UPDATE_PERMISSION_ID = "01HQWXYZ8888888888888TEST";
const TEST_PERMISSION_ID = "01HQWXYZ8888888888888PERM";
const TEST_USER_ID = "01HQWXYZ8888888888888USER";
const TEST_PERMISSION_NAME = "TEST_UPDATE_PERMISSION";
const UPDATED_PERMISSION_NAME = "UPDATED_TEST_PERMISSION";

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

interface UpdatePermissionResponse {
  status: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string | null;
  };
}

describe("/permission/:id (PUT)", () => {
  let accessToken: string;
  let updatePermissionId: string;

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: "permission-update-test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    });

    // First ensure the update permission exists
    let updatePermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, ManagePermission.UPDATE_PERMISSION),
    });

    if (!updatePermission) {
      // Create the permission if it doesn't exist
      updatePermissionId = UPDATE_PERMISSION_ID;
      await db.insert(permissions).values({
        id: updatePermissionId,
        name: ManagePermission.UPDATE_PERMISSION,
        description: "Permission to update permissions",
      });
    } else {
      updatePermissionId = updatePermission.id;
    }

    // Create a test permission to update
    await db.insert(permissions).values({
      id: TEST_PERMISSION_ID,
      name: TEST_PERMISSION_NAME,
      description: "Test permission for updating",
    });

    // Assign permission to user
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: TEST_USER_ID,
      permissionId: updatePermissionId,
      revoked: false,
    });

    // Login to get access token
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "permission-update-test@test.com",
        password: "password",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const loginJson = (await loginResponse.json()) as LoginResponse;
    accessToken = loginJson.data.accessToken;
  });

  it("should return unauthorized when no token provided", async () => {
    const response = await fetch(`${API_URL}/permission/${TEST_PERMISSION_ID}`, {
      method: "PUT",
      body: JSON.stringify({
        name: UPDATED_PERMISSION_NAME,
        description: "Updated test permission description",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
  });

  it("should return permission not found for invalid permission id", async () => {
    const invalidPermissionId = "01HQWXYZ9999999999999INVALID";
    const response = await fetch(`${API_URL}/permission/${invalidPermissionId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: UPDATED_PERMISSION_NAME,
        description: "Updated test permission description",
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.PERMISSION_NOT_FOUND);
  });

  it("should update permission successfully", async () => {
    const updateData = {
      name: UPDATED_PERMISSION_NAME,
      description: "Updated test permission description",
    };

    const response = await fetch(`${API_URL}/permission/${TEST_PERMISSION_ID}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as UpdatePermissionResponse;
    const decryptJson = decryptResponse(json.data as unknown as string) as any;
    expect(json.status).toBe(true);
    expect(json.message).toBe(SuccessMessage.PERMISSION_UPDATED);
    expect(decryptJson?.data?.id).toBe(TEST_PERMISSION_ID);
    expect(decryptJson?.data?.name).toBe(updateData.name);
    expect(decryptJson?.data?.description).toBe(updateData.description);
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
        eq(userPermissions.permissionId, updatePermissionId)
      )
    );

    // Delete test user
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
  });
}); 