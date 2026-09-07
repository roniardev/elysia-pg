import { Elysia } from "elysia"

import { createUser } from "@/src/users/delivery/presenter/http/create_user"
import { deleteUser } from "@/src/users/delivery/presenter/http/delete_user"
import { getListUsers } from "@/src/users/delivery/presenter/http/get_list_users"
import { getUser } from "@/src/users/delivery/presenter/http/get_user"

export const users = new Elysia()
    .use(createUser)
    .use(getUser)
    .use(deleteUser)
    .use(getListUsers)
