import type {
    AuthTokenId,
    PermissionId,
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity-id"

export type UserPermission = {
    createdAt: Date
    id: UserPermissionId
    permissionId: PermissionId
    revoked: boolean
    updatedAt: Date | null
    userId: UserId
}

export type User = {
    createdAt: Date
    deletedAt: Date | null
    email: string
    emailVerified: boolean
    hashedPassword: string | null
    id: UserId
    photo: string | null
    updatedAt: Date | null
}

export type UserWithPermissions = User & {
    permissions: UserPermission[]
}

export type UserListQuery = {
    limit: number
    page: number
}

export type CreateUserRecord = {
    email: string
    emailVerified: boolean
    emailVerification?: {
        expiresAt: Date
        hashedToken: string
        id: AuthTokenId
    }
    hashedPassword: string
    id: UserId
    permissions: {
        id: UserPermissionId
        permissionId: PermissionId
    }[]
}
