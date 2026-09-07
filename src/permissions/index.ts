import { Elysia } from "elysia"

import { createPermission } from "@/src/permissions/delivery/presenter/http/create_permission"
import { deletePermission } from "@/src/permissions/delivery/presenter/http/delete_permission"
import { getListPermissions } from "@/src/permissions/delivery/presenter/http/get_list_permissions"
import { getPermission } from "@/src/permissions/delivery/presenter/http/get_permission"
import { updatePermission } from "@/src/permissions/delivery/presenter/http/update_permission"

export const permissions = new Elysia()
    .use(createPermission)
    .use(getPermission)
    .use(getListPermissions)
    .use(updatePermission)
    .use(deletePermission)
