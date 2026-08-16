import { createUserPermission } from "@/src/user-permissions/service/create"
import { deleteUserPermission } from "@/src/user-permissions/service/delete"
import { readUserPermission } from "@/src/user-permissions/service/read"
import { readAllUserPermission } from "@/src/user-permissions/service/read-all"
import { updateUserPermission } from "@/src/user-permissions/service/update"

export { UserPermissionServiceError } from "@/src/user-permissions/service/error"

export const UserPermissionService = {
    create: createUserPermission,
    read: readUserPermission,
    readAll: readAllUserPermission,
    update: updateUserPermission,
    delete: deleteUserPermission,
}
