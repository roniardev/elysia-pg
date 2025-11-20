import { db } from "@/db"
import { organizations, userOrganizations, users, userPermissions, scopeUserPermissions, scopes } from "@/db/schema"
import { ulid } from "ulid"
import { eq, and } from "drizzle-orm"

export interface TestUserSetup {
	userId: string
	organizationId: string
	email: string
	password: string
}

/**
 * Creates a test user with organization and permissions
 */
export async function createTestUser(params?: {
	email?: string
	password?: string
	permissionIds?: string[]
}): Promise<TestUserSetup> {
	const userId = ulid()
	const organizationId = ulid()
	const email = params?.email || `test-${userId}@test.com`
	const password = params?.password || "password123"

	// Create user
	await db.insert(users).values({
		id: userId,
		email,
		hashedPassword: await Bun.password.hash(password),
		emailVerified: true,
	})

	// Create organization
	await db.insert(organizations).values({
		id: organizationId,
		name: `Test Organization ${userId}`,
		slug: `test-org-${userId}`,
		ownerId: userId,
	})

	// Link user to organization
	await db.insert(userOrganizations).values({
		userId,
		organizationId,
		role: "owner",
	})

	// Add permissions if provided
	if (params?.permissionIds && params.permissionIds.length > 0) {
		const userPermissionsData = params.permissionIds.map(permissionId => ({
			id: ulid(),
			userId,
			permissionId,
		}))
		await db.insert(userPermissions).values(userPermissionsData)

		// Get personal scope
		const personalScope = await db.query.scopes.findFirst({
			where: (table, { eq }) => eq(table.name, "personal")
		})

		// Add scope permissions
		if (personalScope) {
			const scopePermissionsData = userPermissionsData.map(up => ({
				id: ulid(),
				scopeId: personalScope.id,
				userPermissionId: up.id,
			}))
			await db.insert(scopeUserPermissions).values(scopePermissionsData)
		}
	}

	return {
		userId,
		organizationId,
		email,
		password,
	}
}

/**
 * Cleans up test user and related data
 */
export async function cleanupTestUser(userId: string, organizationId: string) {
	const { redis } = await import("@/utils/services/redis")

	// Delete redis tokens
	await redis.del(`${userId}:refreshToken`)
	await redis.del(`${userId}:accessToken`)

	// Delete scope user permissions
	const userPerms = await db.query.userPermissions.findMany({
		where: (table, { eq }) => eq(table.userId, userId)
	})

	for (const perm of userPerms) {
		await db.delete(scopeUserPermissions).where(
			eq(scopeUserPermissions.userPermissionId, perm.id)
		)
	}

	// Delete user permissions
	await db.delete(userPermissions).where(eq(userPermissions.userId, userId))

	// Delete user organizations
	await db.delete(userOrganizations).where(
		eq(userOrganizations.userId, userId)
	)

	// Delete organization
	await db.delete(organizations).where(eq(organizations.id, organizationId))

	// Delete user
	await db.delete(users).where(eq(users.id, userId))
}

/**
 * Login test user and get access token
 */
export async function loginTestUser(
	email: string,
	password: string,
	apiUrl: string
): Promise<string> {
	const loginResponse = await fetch(`${apiUrl}/login`, {
		method: "POST",
		body: JSON.stringify({ email, password }),
		headers: { "Content-Type": "application/json" },
	})

	const loginJson = await loginResponse.json()
	return loginJson.data.accessToken
}
