/**
 * Template for generating create test files
 */
export const createTestTemplate = (sourceName: string) => {
  const lowerSourceName = sourceName.toLowerCase()
  
  return `import { afterAll, beforeAll, describe, expect, it } from "bun:test"
import { db } from "@/db"
import { permissions, ${lowerSourceName}, userPermissions, users } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { redis } from "@/utils/services/redis"
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message"
import { config } from "@/app/config"
import { ulid } from "ulid"
import { decryptResponse } from "@/utils/decrypt-response"

const API_URL = `${config.API_URL}:${config.PORT}`

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

interface Create${sourceName}Response {
  status: boolean
  message: string
  data: {
    id: string
    name: string
    // Add other fields specific to your model here
  }
}

describe("/${lowerSourceName}", () => {
  let accessToken: string
  const userId = "1"

  beforeAll(async () => {
    // Create a test user
    await db.insert(users).values({
      id: userId,
      email: "test@test.com",
      hashedPassword: await Bun.password.hash("password"),
      emailVerified: true,
    })

    // First ensure the permission exists
    const createPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, "create:${lowerSourceName}")
    })
    
    if (!createPermission) {
      throw new Error("Create permission not found in database")
    }

    // Create user permission
    await db.insert(userPermissions).values({
      id: ulid(),
      userId: userId,
      permissionId: createPermission.id,
    })

    // Login to get access token
    const loginResponse = await fetch(`${API_URL}/login`, {
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
    const response = await fetch(`${API_URL}/${lowerSourceName}`, {
      method: "POST",
      body: JSON.stringify({
        name: "Test ${sourceName} unauthorized",
        // Add other fields specific to your model here
      }),
      headers: { "Content-Type": "application/json" },
    })

    const json = (await response.json()) as ErrorResponse
    expect(json.status).toBe(false)
    expect(json.message).toBe(ErrorMessage.UNAUTHORIZED)
  })

  it("should create a ${lowerSourceName} successfully", async () => {
    const ${lowerSourceName}Data = {
      name: "Test ${sourceName}",
      // Add other fields specific to your model here
    }

    const response = await fetch(`${API_URL}/${lowerSourceName}`, {
      method: "POST",
      body: JSON.stringify(${lowerSourceName}Data),
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`
      },
    })

    const json = (await response.json()) as Create${sourceName}Response
    const decryptedJson = decryptResponse(json.data as unknown as string)
    expect(json?.status).toBe(true)
    expect(json?.message).toBe(SuccessMessage.${sourceName.toUpperCase()}_CREATED)
    expect(decryptedJson?.data).toHaveProperty("id")
    expect(decryptedJson?.data.name).toBe(${lowerSourceName}Data.name)
    // Add assertions for other fields specific to your model here
  })

  afterAll(async () => {
    // Clean up test data
    await redis.del(`${userId}:refreshToken`)
    await redis.del(`${userId}:accessToken`)
    
    const createPermission = await db.query.permissions.findFirst({
      where: (table, { eq }) => eq(table.name, "create:${lowerSourceName}")
    })
    
    if (createPermission) {
      await db.delete(userPermissions).where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, createPermission.id)
        )
      )
    }
    
    await db.delete(${lowerSourceName}).where(eq(${lowerSourceName}.userId, userId))
    await db.delete(users).where(eq(users.id, userId))
  })
})
`
}