import type { PermissionPermission, PostPermission, UserPermission } from "@/common/enum/permissions";
import { db } from "@/db";

export const verifyPermission = async (
	permission: PostPermission | UserPermission | PermissionPermission,
	userId: string,
) => {
	const existingUser = await db.query.users.findFirst({
		where: (table, { eq }) => {
			return eq(table.id, userId);
		},
	});

	if (!existingUser) {
		return {
			valid: false,
			message: "Unauthorized",
		};
	}

	const getPermission = await db.query.permissions.findFirst({
		where: (table, { eq }) => {
			return eq(table.name, permission);
		},
	});

	if (!getPermission) {
		return {
			valid: false,
			message: "Unauthorized",
		};
	}

	const userPermission = await db.query.userPermissions.findFirst({
		where: (table, { eq, and }) => {
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
