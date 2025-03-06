/**
 * Template for generating update test files
 */
export const updateTestTemplate = (sourceName: string) => {
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

interface Update${sourceName}Response {
  status: boolean;
  message: string;
  data: {
    id: string;
    userId: string;
    name: string;
    // Add other fields specific to your model here
  };
}

describe("/${lowerSourceName}/:id", () => {
  let accessToken: string;
  let ${lowerSourceName}Id: string;
  const userId = "1";
  const original${sourceName}Data = {
    name: "Original ${sourceName} Name",
    // Add other fields specific to your model here
  };
  
  const updated${sourceName}Data = {
    name: "Updated ${sourceName} Name",
    // Add other fields specific to your model here
  };

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: userId,
      email: "test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    });

    // First ensure the permission exists
    const updatePermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, "update:${lowerSourceName}")
    });
    
    if (!updatePermission) {
      throw new Error("Update permission not found in database");
    }

    // Create user permission
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: userId,
      permissionId: updatePermission.id,
    });

    // Create a test ${lowerSourceName}
    ${lowerSourceName}Id = ulid();
    await db.insert(${lowerSourceName}).values({
      id: ${lowerSourceName}Id,
      userId: userId,
      ...original${sourceName}Data
    });

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
    const response = await fetch(\`\${API_URL}/${lowerSourceName}/\${${lowerSourceName}Id}\`, {
      method: "PUT",
      body: JSON.stringify(updated${sourceName}Data),
      headers: { "Content-Type": "application/json" },
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED);
  });

  it("should return ${lowerSourceName} not found for invalid ${lowerSourceName} id", async () => {
    const invalid${sourceName}Id = ulid();
    const response = await fetch(\`\${API_URL}/${lowerSourceName}/\${invalid${sourceName}Id}\`, {
      method: "PUT",
      body: JSON.stringify(updated${sourceName}Data),
      headers: { 
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${accessToken}\`
      },
    });

    const json = (await response.json()) as ErrorResponse;
    expect(json.status).toBe(false);
    expect(json.message).toBe(ErrorMessage.${sourceName.toUpperCase()}_NOT_FOUND);
  });

  it("should update ${lowerSourceName} successfully", async () => {
    const response = await fetch(\`\${API_URL}/${lowerSourceName}/\${${lowerSourceName}Id}\`, {
      method: "PUT",
      body: JSON.stringify(updated${sourceName}Data),
      headers: { 
        "Content-Type": "application/json",
        "Authorization": \`Bearer \${accessToken}\`
      },
    });

    const json = (await response.json()) as Update${sourceName}Response;
    const decryptJson = decryptResponse(json.data as unknown as string) as any;
    
    expect(json.status).toBe(true);
    expect(json.message).toBe(SuccessMessage.${sourceName.toUpperCase()}_UPDATED);
    expect(decryptJson?.data?.id).toBe(${lowerSourceName}Id);
    expect(decryptJson?.data?.name).toBe(updated${sourceName}Data.name);
    // Add assertions for other fields specific to your model here
    
    // Verify the data was actually updated in the database
    const updated${sourceName} = await db.query.${lowerSourceName}.findFirst({
      where: (table, { eq }) => eq(table.id, ${lowerSourceName}Id)
    });
    
    expect(updated${sourceName}?.name).toBe(updated${sourceName}Data.name);
    // Add assertions for other fields specific to your model here
  });

  afterAll(async () => {
    // Clean up test data
    await redis.del(\`\${userId}:refreshToken\`);
    await redis.del(\`\${userId}:accessToken\`);
    
    const updatePermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, "update:${lowerSourceName}")
    });
    
    if (updatePermission) {
      await db.delete(userPermissions).where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, updatePermission.id)
        )
      );
    }
    
    await db.delete(${lowerSourceName}).where(eq(${lowerSourceName}.id, ${lowerSourceName}Id));
    await db.delete(users).where(eq(users.id, userId));
  });
});
`;
}; 