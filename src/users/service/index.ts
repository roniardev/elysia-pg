import { createUser } from "@/src/users/service/create"
import { deleteUser } from "@/src/users/service/delete"
import { readUser } from "@/src/users/service/read"
import { readAllUser } from "@/src/users/service/read-all"

export { UserServiceError } from "@/src/users/service/error"

export const UserService = {
    create: createUser,
    read: readUser,
    readAll: readAllUser,
    delete: deleteUser,
}
