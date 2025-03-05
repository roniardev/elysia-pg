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
const DELETE_PERMISSION_ID = "01HQWXYZ9999999999999TEST";
const TEST_PERMISSION_ID = "01HQWXYZ9999999999999PERM";
const TEST_USER_ID = "01HQWXYZ9999999999999USER";
const TEST_PERMISSION_NAME = "TEST_DELETE_PERMISSION";
const INVALID_PERMISSION_ID = "01HQWXYZ9999999999999INVALID";

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

interface DeletePermissionResponse {
  status: boolean;
  message: string;
}

describe("/permission/:id (DELETE)", () => {
  let accessToken: string;
  let deletePermissionId: string;

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: "permission-delete-test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    });

    // First ensure the delete permission exists
    let deletePermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, ManagePermission.DELETE_PERMISSION),
    });

    if (!deletePermission) {
      // Create the permission if it doesn't exist
      deletePermissionId = DELETE_PERMISSION_ID;
      await db.insert(permissions).values({
        id: deletePermissionId,
        name: ManagePermission.DELETE_PERMISSION,
        description: "Permission to delete permissions",
      });
    } else {
      deletePermissionId = deletePermission.id;
    }

    // Create a test permission to delete
    await db.insert(permissions).values({
      id: TEST_PERMISSION_ID,
      name: TEST_PERMISSION_NAME,
      description: "Test permission for deleting",
    });

    // Assign permission to user
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: TEST_USER_ID,
      permissionId: deletePermissionId,
      revoked: false,
    });

    // Login to get access token
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "permission-delete-test@test.com",
        password: "password",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const loginJson = (await loginResponse.json()) as LoginResponse;
    accessToken = loginJson.data.accessToken;
  });

  it("should return unauthorized when no token provided", async () => {
    const response = await fetch(`${API_URL}/permission/${TEST_PERMISSION_ID}`, {
      method: "DELETE",
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
  });

  it("should return permission not found for invalid permission id", async () => {
    const response = await fetch(`${API_URL}/permission/${INVALID_PERMISSION_ID}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.PERMISSION_NOT_FOUND);
  });

  it("should delete permission successfully", async () => {
    const response = await fetch(`${API_URL}/permission/${TEST_PERMISSION_ID}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as DeletePermissionResponse;
    expect(json.status).toBe(true);
    expect(json.message).toBe(SuccessMessage.PERMISSION_DELETED);

    // Verify the permission was soft deleted
    const deletedPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.id, TEST_PERMISSION_ID),
    });

    expect(deletedPermission?.deletedAt).not.toBeNull();
  });

  afterAll(async () => {
    // Clean up test data
    await redis.del(`${TEST_USER_ID}:refreshToken`);
    await redis.del(`${TEST_USER_ID}:accessToken`);

    // Hard delete test permission
    await db.delete(permissions).where(eq(permissions.id, TEST_PERMISSION_ID));

    // Delete user permission
    await db.delete(userPermissions).where(
      and(
        eq(userPermissions.userId, TEST_USER_ID),
        eq(userPermissions.permissionId, deletePermissionId)
      )
    );

    // Delete test user
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
  });
}); 