import { eq, isNull } from "drizzle-orm"
import { db } from "@/db"
import { organizations, type Organization } from "@/db/schema"

export interface OrganizationTree extends Organization {
	children: OrganizationTree[]
}

export async function getAncestorOrganizations(organizationId: string): Promise<string[]> {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	})

	if (!org) {
		return []
	}

	if (!org.parentOrganizationId) {
		return [organizationId]
	}

	const parentAncestors = await getAncestorOrganizations(org.parentOrganizationId)
	return [...parentAncestors, organizationId]
}

export async function getDescendantOrganizations(organizationId: string): Promise<string[]> {
	const children = await db.query.organizations.findMany({
		where: eq(organizations.parentOrganizationId, organizationId),
	})

	if (children.length === 0) {
		return [organizationId]
	}

	const descendantPromises = children.map((child) =>
		getDescendantOrganizations(child.id),
	)

	const descendantsArrays = await Promise.all(descendantPromises)
	const allDescendants = descendantsArrays.flat()

	return [organizationId, ...allDescendants]
}

export async function getParentOrganization(organizationId: string): Promise<Organization | null> {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	})

	if (!org) {
		return null
	}

	if (!org.parentOrganizationId) {
		return null
	}

	const parent = await db.query.organizations.findFirst({
		where: eq(organizations.id, org.parentOrganizationId),
	})

	return parent || null
}

export async function getChildOrganizations(organizationId: string): Promise<Organization[]> {
	const children = await db.query.organizations.findMany({
		where: eq(organizations.parentOrganizationId, organizationId),
	})

	return children
}

export async function getRootOrganizations(): Promise<Organization[]> {
	const roots = await db.query.organizations.findMany({
		where: isNull(organizations.parentOrganizationId),
	})

	return roots
}

export async function getOrganizationTree(rootId: string): Promise<OrganizationTree | null> {
	const root = await db.query.organizations.findFirst({
		where: eq(organizations.id, rootId),
	})

	if (!root) {
		return null
	}

	const children = await getChildOrganizations(rootId)
	const childTreePromises = children.map((child) => getOrganizationTree(child.id))
	const childTrees = await Promise.all(childTreePromises)
	const validChildTrees = childTrees.filter((tree): tree is OrganizationTree => tree !== null)

	return {
		...root,
		children: validChildTrees,
	}
}

export async function getOrganizationLevel(organizationId: string): Promise<number> {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	})

	if (!org) {
		return 0
	}

	return org.level
}

export async function updateOrganizationPath(organizationId: string): Promise<void> {
	const ancestors = await getAncestorOrganizations(organizationId)
	const orgsData = await Promise.all(
		ancestors.map((id) =>
			db.query.organizations.findFirst({
				where: eq(organizations.id, id),
			}),
		),
	)

	const names = orgsData
		.filter((org): org is Organization => org !== null)
		.map((org) => org.slug)

	const path = `/${names.join("/")}`
	const level = ancestors.length - 1

	await db
		.update(organizations)
		.set({ organizationPath: path, level })
		.where(eq(organizations.id, organizationId))
}

export async function isAncestorOf(ancestorId: string, descendantId: string): Promise<boolean> {
	const ancestors = await getAncestorOrganizations(descendantId)
	return ancestors.includes(ancestorId)
}

export async function isDescendantOf(descendantId: string, ancestorId: string): Promise<boolean> {
	return isAncestorOf(ancestorId, descendantId)
}

export async function getSiblingOrganizations(organizationId: string): Promise<Organization[]> {
	const org = await db.query.organizations.findFirst({
		where: eq(organizations.id, organizationId),
	})

	if (!org) {
		return []
	}

	if (!org.parentOrganizationId) {
		return []
	}

	const siblings = await db.query.organizations.findMany({
		where: eq(organizations.parentOrganizationId, org.parentOrganizationId),
	})

	return siblings.filter((sibling) => sibling.id !== organizationId)
}
