import { Elysia } from "elysia"

import { jwtAccessSetup } from "@/src/auth/setup/auth"
import bearer from "@elysiajs/bearer"

import { createUserPermission } from "./usecase/create"
import { deleteUserPermission } from "./usecase/delete"
import { readUserPermission } from "./usecase/read"
import { readAllUserPermission } from "./usecase/read-all"
import { updateUserPermission } from "./usecase/update"

export const userPermissions = new Elysia()
    .use(jwtAccessSetup)
    .use(bearer())
    .use(createUserPermission)
    .use(readUserPermission)
    .use(readAllUserPermission)
    .use(updateUserPermission)
    .use(deleteUserPermission)