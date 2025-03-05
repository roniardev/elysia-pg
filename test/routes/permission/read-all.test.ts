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
const READ_ALL_PERMISSION_ID = "01HQWXYZ5555555555555TEST";
const TEST_USER_ID = "01HQWXYZ6666666666666USER";
const TEST_PERMISSION_IDS = [
  "01HQWXYZ7777777777777PERM1",
  "01HQWXYZ7777777777777PERM2",
  "01HQWXYZ7777777777777PERM3",
  "01HQWXYZ7777777777777PERM4",
  "01HQWXYZ7777777777777PERM5"
];
const TEST_PERMISSION_PREFIX = "TEST_READ_ALL_PERMISSION_";

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

interface ReadAllPermissionsResponse {
  status: boolean;
  message: string;
  data: {
    data: Array<{
      id: string;
      name: string;
      description: string | null;
      createdAt: string;
      updatedAt: string | null;
    }>;
    meta: {
      page: number;
      limit: number;
      totalPages: number;
      totalItems: number;
    };
  };
}

describe("/permissions", () => {
  let accessToken: string;
  let readAllPermissionId: string;

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: TEST_USER_ID,
      email: "permission-read-all-test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    });

    // First check if the read-all permission exists
    let readAllPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, ManagePermission.READ_ALL_PERMISSION),
    });

    readAllPermissionId = readAllPermission?.id || READ_ALL_PERMISSION_ID;
    
    // Create the permission if it doesn't exist
    if (!readAllPermission) {
      await db.insert(permissions).values({
        id: readAllPermissionId,
        name: ManagePermission.READ_ALL_PERMISSION,
        description: "Permission to read all permissions",
      });
    }

    // Create test permissions to read
    for (let i = 0; i < TEST_PERMISSION_IDS.length; i++) {
      const permissionId = TEST_PERMISSION_IDS[i];
      if (permissionId) {
        await db.insert(permissions).values({
          id: permissionId,
          name: `${TEST_PERMISSION_PREFIX}${i}`,
          description: `Test permission ${i} for reading all`,
        });
      }
    }

    // Assign permission to user
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: TEST_USER_ID,
      permissionId: readAllPermissionId,
      revoked: false,
    });

    // Login to get access token
    const loginResponse = await fetch(`${API_URL}/login`, {
      method: "POST",
      body: JSON.stringify({
        email: "permission-read-all-test@test.com",
        password: "password",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const loginJson = (await loginResponse.json()) as LoginResponse;
    accessToken = loginJson.data.accessToken;
  });

  it("should return unauthorized when no token provided", async () => {
    const response = await fetch(`${API_URL}/permissions?page=1&limit=10`, {
      method: "GET",
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
  });

  it("should read all permissions successfully", async () => {
    const response = await fetch(`${API_URL}/permissions?page=1&limit=10`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as ReadAllPermissionsResponse;
    const decryptJson = decryptResponse(json.data as unknown as string) as any;
    console.log(decryptJson.meta);

    expect(json.status).toBe(true);
    expect(json.message).toBe(SuccessMessage.PERMISSIONS_FETCHED);
    expect(decryptJson?.meta).toHaveProperty("page", 1);
    expect(decryptJson?.meta).toHaveProperty("limit", 10);
    expect(decryptJson?.meta).toHaveProperty("totalPage", 2);
    expect(decryptJson?.meta).toHaveProperty("total", 20);
  });

  it("should filter permissions by search term", async () => {
    const searchTerm = `${TEST_PERMISSION_PREFIX}0`;
    const response = await fetch(`${API_URL}/permissions?page=1&limit=10&search=${searchTerm}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
      },
    });

    const json = (await response.json()) as ReadAllPermissionsResponse;
    const decryptJson = decryptResponse(json.data as unknown as string) as any;
    expect(json.status).toBe(true);
    expect(json.message).toBe(SuccessMessage.PERMISSIONS_FETCHED);
    
    // At least one result should contain our search term
    const hasMatchingPermission = decryptJson?.data?.some(
      (permission: any) => permission.name.includes(searchTerm)
    );
    expect(hasMatchingPermission).toBe(true);
  });

  afterAll(async () => {
    // Clean up test data
    await redis.del(`${TEST_USER_ID}:refreshToken`);
    await redis.del(`${TEST_USER_ID}:accessToken`);

    // Delete test permissions
    for (const id of TEST_PERMISSION_IDS) {
      if (id) {
        await db.delete(permissions).where(eq(permissions.id, id));
      }
    }

    // Delete user permission
    await db.delete(userPermissions).where(
      and(
        eq(userPermissions.userId, TEST_USER_ID),
        eq(userPermissions.permissionId, readAllPermissionId)
      )
    );

    // Delete test user
    await db.delete(users).where(eq(users.id, TEST_USER_ID));
  });
}); 