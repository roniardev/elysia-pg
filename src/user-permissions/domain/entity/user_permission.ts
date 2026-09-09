import type {
    PermissionId,
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity_id"

export type PermissionSummary = {
    description: string | null
    id: PermissionId
    name: string
}

export type UserPermission = {
    createdAt: Date
    id: UserPermissionId
    permissionId: PermissionId
    revoked: boolean
    updatedAt: Date | null
    userId: UserId
}

export type UserPermissionDetail = UserPermission & {
    permission: PermissionSummary
}

export type UserPermissionResponse = {
    createdAt: string
    id: UserPermissionId
    permission: PermissionSummary
    permissionId: PermissionId
    revoked: boolean
    updatedAt: string | null
    userId: UserId
}

export type CreateUserPermissionParam = {
    permissionId: PermissionId
    userId: UserId
}

export type CreateUserPermissionRecord = CreateUserPermissionParam & {
    id: UserPermissionId
}

export type UserPermissionListQuery = {
    includeRevoked?: boolean
    limit: number
    page: number
    userId: UserId
}

export type UpdateUserPermissionParam = {
    revoked: boolean
}

export const toUserPermissionResponse = (
    userPermission: UserPermissionDetail,
): UserPermissionResponse => ({
    id: userPermission.id,
    userId: userPermission.userId,
    permissionId: userPermission.permissionId,
    revoked: userPermission.revoked,
    createdAt: userPermission.createdAt.toISOString(),
    updatedAt: userPermission.updatedAt?.toISOString() ?? null,
    permission: userPermission.permission,
})
