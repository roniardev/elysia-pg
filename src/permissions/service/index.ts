import { createPermission } from "@/src/permissions/service/create"
import { deletePermission } from "@/src/permissions/service/delete"
import { readPermission } from "@/src/permissions/service/read"
import { readAllPermission } from "@/src/permissions/service/read-all"
import { updatePermission } from "@/src/permissions/service/update"

export const PermissionService = {
    create: createPermission,
    read: readPermission,
    readAll: readAllPermission,
    update: updatePermission,
    delete: deletePermission,
}
