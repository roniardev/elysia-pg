/**
 * Template for generating read-all test files
 */
export const readAllTestTemplate = (sourceName: string) => {
  const lowerSourceName = sourceName.toLowerCase();
  
  return `import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { db } from "@/db";
import { permissions, ${lowerSourceName}, userPermissions, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { redis } from "@/utils/services/redis";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";
import { config } from "@/app/config";
import { ulid } from "ulid";
import { decryptResponse } from "@/utils/decrypt-response";

const API_URL = \`\${config.API_URL}:\${config.PORT}\`;

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

interface ReadAll${sourceName}Response {
  status: boolean;
  message: string;
  data: {
    data: Array<{
      id: string;
      userId: string;
      name: string;
      // Add other fields specific to your model here
    }>;
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

describe("/${lowerSourceName}", () => {
  let accessToken: string;
  const ${lowerSourceName}Ids: string[] = [];
  const userId = "1";
  const totalItems = 15;

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: userId,
      email: "test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    });

    // First ensure the permission exists
    const readPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, "read:${lowerSourceName}")
    });
    
    if (!readPermission) {
      throw new Error("Read permission not found in database");
    }

    // Create user permission
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: userId,
      permissionId: readPermission.id,
    });

    // Create test ${lowerSourceName}s
    for (let i = 0; i < totalItems; i++) {
      const ${lowerSourceName}Id = ulid();
      ${lowerSourceName}Ids.push(${lowerSourceName}Id);
      
      await db.insert(${lowerSourceName}).values({
        id: ${lowerSourceName}Id,
        userId: userId,
        name: \`Test ${sourceName} \${i + 1}\`,
        // Add other fields specific to your model here
      });
    }

    // Login to get access token
    const loginResponse = await fetch(\`\${API_URL}/login\`, {
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
    const response = await fetch(\`\${API_URL}/${lowerSourceName}?page=1&limit=10\`, {
      method: "GET",
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
  });

  it("should read all ${lowerSourceName}s with pagination (page 1)", async () => {
    const page = 1;
    const limit = 10;
    
    const response = await fetch(\`\${API_URL}/${lowerSourceName}?page=\${page}&limit=\${limit}\`, {
      method: "GET",
      headers: { 
        "Authorization": \`Bearer \${accessToken}\`
      },
    });

    const json = (await response.json()) as ReadAll${sourceName}Response;
    const decryptJson = decryptResponse(json.data as unknown as string) as any;
    
    expect(json.status).toBe(true);
    expect(json.message).toBe(SuccessMessage.${sourceName.toUpperCase()}_READ);
    expect(decryptJson?.data?.data.length).toBe(limit);
    expect(decryptJson?.data?.meta.page).toBe(page);
    expect(decryptJson?.data?.meta.limit).toBe(limit);
    expect(decryptJson?.data?.meta.total).toBe(totalItems);
    expect(decryptJson?.data?.meta.totalPages).toBe(Math.ceil(totalItems / limit));
  });

  it("should read all ${lowerSourceName}s with pagination (page 2)", async () => {
    const page = 2;
    const limit = 10;
    const expectedItemsOnPage2 = totalItems - limit;
    
    const response = await fetch(\`\${API_URL}/${lowerSourceName}?page=\${page}&limit=\${limit}\`, {
      method: "GET",
      headers: { 
        "Authorization": \`Bearer \${accessToken}\`
      },
    });

    const json = (await response.json()) as ReadAll${sourceName}Response;
    const decryptJson = decryptResponse(json.data as unknown as string) as any;
    
    expect(json.status).toBe(true);
    expect(json.message).toBe(SuccessMessage.${sourceName.toUpperCase()}_READ);
    expect(decryptJson?.data?.data.length).toBe(expectedItemsOnPage2);
    expect(decryptJson?.data?.meta.page).toBe(page);
    expect(decryptJson?.data?.meta.limit).toBe(limit);
    expect(decryptJson?.data?.meta.total).toBe(totalItems);
    expect(decryptJson?.data?.meta.totalPages).toBe(Math.ceil(totalItems / limit));
  });

  afterAll(async () => {
    // Clean up test data
    await redis.del(\`\${userId}:refreshToken\`);
    await redis.del(\`\${userId}:accessToken\`);
    
    const readPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, "read:${lowerSourceName}")
    });
    
    if (readPermission) {
      await db.delete(userPermissions).where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, readPermission.id)
        )
      );
    }
    
    for (const id of ${lowerSourceName}Ids) {
      await db.delete(${lowerSourceName}).where(eq(${lowerSourceName}.id, id));
    }
    
    await db.delete(users).where(eq(users.id, userId));
  });
});
`;
}; 