import { Elysia } from "elysia"

import { createUserPermission } from "@/src/user-permissions/delivery/presenter/http/create_user_permission"
import { deleteUserPermission } from "@/src/user-permissions/delivery/presenter/http/delete_user_permission"
import { getListUserPermissions } from "@/src/user-permissions/delivery/presenter/http/get_list_user_permissions"
import { getUserPermission } from "@/src/user-permissions/delivery/presenter/http/get_user_permission"
import { updateUserPermission } from "@/src/user-permissions/delivery/presenter/http/update_user_permission"

export const userPermissions = new Elysia()
    .use(createUserPermission)
    .use(getUserPermission)
    .use(getListUserPermissions)
    .use(updateUserPermission)
    .use(deleteUserPermission)
