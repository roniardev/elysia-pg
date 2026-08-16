import { Elysia } from "elysia"

import { createUser } from "@/src/users/usecase/create"
import { deleteUser } from "@/src/users/usecase/delete"
import { readUser } from "@/src/users/usecase/read"
import { readAllUser } from "@/src/users/usecase/read-all"

export const users = new Elysia()
    .use(createUser)
    .use(readUser)
    .use(deleteUser)
    .use(readAllUser)
