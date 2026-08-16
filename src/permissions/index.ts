import { Elysia } from "elysia"

import { createPermission } from "@/src/permissions/usecase/create"
import { deletePermission } from "@/src/permissions/usecase/delete"
import { readPermission } from "@/src/permissions/usecase/read"
import { readAllPermission } from "@/src/permissions/usecase/read-all"
import { updatePermission } from "@/src/permissions/usecase/update"

export const permissions = new Elysia()
    .use(createPermission)
    .use(readPermission)
    .use(readAllPermission)
    .use(updatePermission)
    .use(deletePermission)
