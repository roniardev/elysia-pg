import { and, eq } from "drizzle-orm";

import type { PostPermission, UserPermission } from "@/common/enum/permissions";
import { db } from "@/db";

export const verifyPermission = async (
	permission: PostPermission | UserPermission,
	userId: string,
) => {
	const existingUser = await db.query.users.findFirst({
		where: (table, { eq: eqFn }) => {
			return eqFn(table.id, userId);
		},
	});

	if (!existingUser) {
		return {
			valid: false,
			message: "Unauthorized",
		};
	}

	const getPermission = await db.query.permissions.findFirst({
		where: (table, { eq: eqFn }) => {
			return eqFn(table.name, permission);
		},
	});

	if (!getPermission) {
		return {
			valid: false,
			message: "Unauthorized",
		};
	}

	const userPermission = await db.query.userPermissions.findFirst({
		where: (table) => {
			return and(
				eq(table.userId, existingUser.id),
				eq(table.permissionId, getPermission.id),
				eq(table.revoked, false),
			);
		},
	});

	if (!userPermission) {
		return {
			valid: false,
			message: "Unauthorized",
		};
	}

	return {
		permission: userPermission.id,
		valid: true,
		message: "Authorized",
	};
};
