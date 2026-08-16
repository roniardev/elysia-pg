import { and, eq } from "drizzle-orm"

import type {
    ManagePermission,
    ManageUserPermission,
    PostPermission,
    UserPermission,
} from "@/common/enum/permissions"
import { db } from "@/db"

export const verifyPermission = async (
    permission:
        | PostPermission
        | UserPermission
        | ManagePermission
        | ManageUserPermission,
    userId: string,
) => {
    // ONE relational query hydrates the user-permission, its permission
    // and the optional scope; the permission-name match happens in JS,
    // which avoids an IN subquery in the generated SQL
    const userPermission = await db.query.userPermissions.findFirst({
        where: (table, { eq, and }) =>
            and(eq(table.userId, userId), eq(table.revoked, false)),
        with: {
            permission: true,
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

    if (userPermission.permission?.name !== permission) {
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
