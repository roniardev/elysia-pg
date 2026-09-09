import type {
    PermissionSummary,
    UserPermission,
    UserPermissionDetail,
} from "@/src/user-permissions/domain/entity/user_permission"
import {
    PermissionId,
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity_id"

type UserPermissionRow = Omit<
    UserPermission,
    "id" | "permissionId" | "userId"
> & {
    id: string
    permissionId: string
    userId: string
}

type UserPermissionDetailRow = UserPermissionRow & {
    permission: Omit<PermissionSummary, "id"> & {
        id: string
    }
}

export const toUserPermission = (row: UserPermissionRow): UserPermission => ({
    ...row,
    id: UserPermissionId(row.id),
    permissionId: PermissionId(row.permissionId),
    userId: UserId(row.userId),
})

export const toUserPermissionDetail = (
    row: UserPermissionDetailRow,
): UserPermissionDetail => ({
    ...toUserPermission(row),
    permission: {
        id: PermissionId(row.permission.id),
        name: row.permission.name,
        description: row.permission.description,
    },
})
