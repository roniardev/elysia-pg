import { Elysia } from "elysia"

import { createUserPermission } from "@/src/user-permissions/usecase/create"
import { deleteUserPermission } from "@/src/user-permissions/usecase/delete"
import { readUserPermission } from "@/src/user-permissions/usecase/read"
import { readAllUserPermission } from "@/src/user-permissions/usecase/read-all"
import { updateUserPermission } from "@/src/user-permissions/usecase/update"

export const userPermissions = new Elysia()
    .use(createUserPermission)
    .use(readUserPermission)
    .use(readAllUserPermission)
    .use(updateUserPermission)
    .use(deleteUserPermission)
