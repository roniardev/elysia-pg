import type {
    User as UserRow,
    UserPermission as UserPermissionRow,
} from "@/db/schema"
import {
    PermissionId,
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity_id"
import type { UserWithPermissions } from "@/src/users/domain/entity/user"

export type UserWithPermissionsRow = UserRow & {
    permissions: UserPermissionRow[]
}

export const toUserWithPermissions = (
    row: UserWithPermissionsRow,
): UserWithPermissions => ({
    ...row,
    id: UserId(row.id),
    permissions: row.permissions.map((permission) => ({
        ...permission,
        id: UserPermissionId(permission.id),
        permissionId: PermissionId(permission.permissionId),
        userId: UserId(permission.userId),
    })),
})
