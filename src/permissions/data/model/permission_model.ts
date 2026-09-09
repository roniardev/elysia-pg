import type { Permission as PermissionRow } from "@/db/schema"
import { PermissionId } from "@/src/general/domain/entity_id"
import type { Permission } from "@/src/permissions/domain/entity/permission"

export const toPermission = (row: PermissionRow): Permission => ({
    ...row,
    id: PermissionId(row.id),
})
