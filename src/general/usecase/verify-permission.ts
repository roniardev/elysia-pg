import { eq, inArray } from "drizzle-orm"

import type {
    ManagePermission,
    ManageUserPermission,
    PostPermission,
    UserPermission,
} from "@/common/enum/permissions"
import { db } from "@/db"
import { permissions } from "@/db/schema/permission"

export const verifyPermission = async (
    permission:
        | PostPermission
        | UserPermission
        | ManagePermission
        | ManageUserPermission,
    userId: string,
) => {
    // ONE query hydrates user-permission, the permission-name match
    // (IN subquery) and the optional scope; replaces the previous
    // 4-query auth pipeline
    const permissionSubquery = db
        .select({ id: permissions.id })
        .from(permissions)
        .where(eq(permissions.name, permission))

    const userPermission = await db.query.userPermissions.findFirst({
        where: (table, { eq, and, inArray }) =>
            and(
                eq(table.userId, userId),
                eq(table.revoked, false),
                inArray(table.permissionId, permissionSubquery),
            ),
        with: {
            scopeUserPermissions: {
                with: {
                    scope: true,
                },
            },
        },
    })

    if (!userPermission) {
        return {
            valid: false,
            message: "Unauthorized",
        }
    }

    return {
        permission: userPermission.id,
        scope: userPermission.scopeUserPermissions[0]?.scope?.name ?? null,
        valid: true,
        message: "Authorized",
    }
}
