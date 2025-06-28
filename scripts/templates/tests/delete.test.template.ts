/**
 * Template for generating delete test files
 */
export const deleteTestTemplate = (sourceName: string) => {
  const lowerSourceName = sourceName.toLowerCase()
  
  return `import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { db } from "@/db"
import { permissions, ${lowerSourceName}, userPermissions, users } from "@/db/schema"
import { and, eq, isNull } from "drizzle-orm"
import { redis } from "@/utils/services/redis"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import { config } from "@/app/config"
import { ulid } from "ulid"

const API_URL = \`${config.API_URL}:${config.PORT}\`

interface LoginResponse {
  status: boolean
  message: string
  data: {
    accessToken: string
  }
}

interface ErrorResponse {
  status: boolean
  message: string
}

interface DeleteResponse {
  status: boolean
  message: string
}

describe("/${lowerSourceName}/:id", () => {
  let accessToken: string
  let ${lowerSourceName}Id: string
  const userId = "1"
  const ${lowerSourceName}Data = {
    name: "Test ${sourceName} to Delete",
    // Add other fields specific to your model here
  }

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: userId,
      email: "test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    })

    // First ensure the permission exists
    const deletePermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, "delete:${lowerSourceName}")
    })
    
    if (!deletePermission) {
      throw new Error("Delete permission not found in database")
    }

    // Create user permission
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: userId,
      permissionId: deletePermission.id,
    })

    // Create a test ${lowerSourceName}
    ${lowerSourceName}Id = ulid()
    await db.insert(${lowerSourceName}).values({
      id: ${lowerSourceName}Id,
      userId: userId,
      ...${lowerSourceName}Data
    })

    // Login to get access token
    const loginResponse = await fetch(\`\${API_URL}/login\`, {
      method: "POST",
      body: JSON.stringify({
        email: "test@test.com",
        password: "password",
      }),
      headers: { "Content-Type": "application/json" },
    })

    const loginJson = (await loginResponse.json()) as LoginResponse
    accessToken = loginJson.data.accessToken
  })

  it("should return unauthorized when no token provided", async () => {
    const response = await fetch(\`\${API_URL}/${lowerSourceName}/\${${lowerSourceName}Id}\`, {
      method: "DELETE",
    })

    const json = (await response.json()) as ErrorResponse
    expect(json.status).toBe(false)
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED)
  })

  it("should return ${lowerSourceName} not found for invalid ${lowerSourceName} id", async () => {
    const invalid${sourceName}Id = ulid()
    const response = await fetch(\`\${API_URL}/${lowerSourceName}/\${invalid${sourceName}Id}\`, {
      method: "DELETE",
      headers: { 
        "Authorization": \`Bearer \${accessToken}\`
      },
    })

    const json = (await response.json()) as ErrorResponse
    expect(json.status).toBe(false)
    expect(json.message).toBe(ErrorMessage.${sourceName.toUpperCase()}_NOT_FOUND)
  })

  it("should delete ${lowerSourceName} successfully (soft delete)", async () => {
    const response = await fetch(\`\${API_URL}/${lowerSourceName}/\${${lowerSourceName}Id}\`, {
      method: "DELETE",
      headers: { 
        "Authorization": \`Bearer \${accessToken}\`
      },
    })

    const json = (await response.json()) as DeleteResponse
    expect(json.status).toBe(true)
    expect(json.message).toBe(SuccessMessage.${sourceName.toUpperCase()}_DELETED)
    
    // Verify the ${lowerSourceName} was soft deleted (deletedAt is not null)
    const deleted${sourceName} = await db.query.${lowerSourceName}.findFirst({
      where: (table, { eq }) => eq(table.id, ${lowerSourceName}Id)
    })
    
    expect(deleted${sourceName}?.deletedAt).not.toBeNull()
  })

  afterAll(async () => {
    // Clean up test data
    await redis.del(\`\${userId}:refreshToken\`)
    await redis.del(\`\${userId}:accessToken\`)
    
    const deletePermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, "delete:${lowerSourceName}")
    })
    
    if (deletePermission) {
      await db.delete(userPermissions).where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, deletePermission.id)
        )
      )
    }
    
    // Hard delete the ${lowerSourceName} for cleanup
    await db.delete(${lowerSourceName}).where(eq(${lowerSourceName}.id, ${lowerSourceName}Id))
    await db.delete(users).where(eq(users.id, userId))
  })
})
`
}