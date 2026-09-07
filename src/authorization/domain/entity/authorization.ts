import type {
    ManagePermission,
    ManageUserPermission,
    PostPermission,
    UserPermission,
} from "@/common/enum/permissions"
import type { Scope } from "@/common/enum/scopes"
import type {
    UserId,
    UserPermissionId,
} from "@/src/general/domain/entity-id"

export type PermissionName =
    | ManagePermission
    | ManageUserPermission
    | PostPermission
    | UserPermission

export type AuthorizationScope = `${Scope}`

export type AuthorizationRequest = {
    accessToken: string
    permission: PermissionName
    tokenExpiresAt?: number
    userId: UserId
}

export type PermissionGrant = {
    id: UserPermissionId
    scope: AuthorizationScope | null
}

export type Authorization = {
    scope: AuthorizationScope | null
    userId: UserId
}
