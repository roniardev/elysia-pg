import type { PermissionId } from "@/src/general/domain/entity-id"
import type { SortDirection } from "@/src/general/domain/sort-direction"

export type Permission = {
    createdAt: Date
    deletedAt: Date | null
    description: string | null
    id: PermissionId
    name: string
    updatedAt: Date | null
}

export type PermissionListQuery = {
    limit: number
    page: number
    search?: string
    sort?: SortDirection
}

export type PermissionUpdate = {
    description?: string
    name?: string
}

export type CreatePermissionRecord = {
    description?: string
    id: PermissionId
    name: string
}
