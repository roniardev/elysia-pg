import { eq, and, SQL, like } from "drizzle-orm"
import { Scope } from "@/common/enum/scopes"
import { posts } from "@/db/schema"

/**
 * Validates if organization context is required based on scope
 * @param organizationId - Organization ID from JWT token
 * @param scope - User's scope
 * @returns true if valid, false if organization context is required but missing
 */
export function isOrganizationContextValid(
	organizationId: string | undefined,
	scope: string,
): boolean {
	if (!organizationId && scope !== Scope.GLOBAL && scope !== Scope.SUPER_ADMIN) {
		return false
	}
	return true
}

/**
 * Builds query conditions for post queries based on scope
 * @param scope - User's scope
 * @param organizationId - Organization ID from JWT token
 * @param userId - User ID
 * @param postId - Optional post ID to filter by
 * @param search - Optional search term for title
 * @returns Array of query conditions
 */
export function buildPostQueryConditions(params: {
	scope: string
	organizationId?: string
	userId: string
	postId?: string
	search?: string
}): SQL[] {
	const { scope, organizationId, userId, postId, search } = params
	const conditions: SQL[] = []

	if (postId) {
		conditions.push(eq(posts.id, postId))
	}

	if (scope === Scope.PERSONAL) {
		conditions.push(eq(posts.userId, userId))
		if (organizationId) {
			conditions.push(eq(posts.organizationId, organizationId))
		}
	}

	if (scope === Scope.ORGANIZATION && organizationId) {
		conditions.push(eq(posts.organizationId, organizationId))
	}

	if (search) {
		conditions.push(like(posts.title, `%${search}%`))
	}

	return conditions
}

/**
 * Validates if user owns the post (for personal scope operations)
 * @param scope - User's scope
 * @param postUserId - User ID who owns the post
 * @param currentUserId - Current user ID
 * @returns true if user owns the post or scope allows access
 */
export function validatePostOwnership(
	scope: string,
	postUserId: string,
	currentUserId: string,
): boolean {
	if (scope === Scope.PERSONAL && postUserId !== currentUserId) {
		return false
	}
	return true
}
