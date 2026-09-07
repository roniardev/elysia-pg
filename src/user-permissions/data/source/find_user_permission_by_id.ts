import type { Database } from "@/db/database"

export const getUserPermissionById = (
    database: Database,
    id: string,
) => database.query.userPermissions.findFirst({
    where: (fields, { eq }) => eq(fields.id, id),
    with: {
        permission: true,
    },
})
