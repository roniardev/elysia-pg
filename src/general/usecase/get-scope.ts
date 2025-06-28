import { db } from "@/db"

export const getScope = async (userPermissionId: string) => {
    const scope = await db.query.scopeUserPermissions.findFirst({
        where: (table, { eq }) => eq(table.userPermissionId, userPermissionId),
        with: {
            scope: true,
        },
    })

    if (!scope) {
        return null
    }

    return scope.scope.name
}
