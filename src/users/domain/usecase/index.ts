import { createUserUsecase } from "@/src/users/domain/usecase/create_user_usecase"
import { deleteUserUsecase } from "@/src/users/domain/usecase/delete_user_usecase"
import { getListUserUsecase } from "@/src/users/domain/usecase/get_list_user_usecase"
import { getUserUsecase } from "@/src/users/domain/usecase/get_user_usecase"

export const UserUsecase = {
    create: createUserUsecase,
    get: getUserUsecase,
    getList: getListUserUsecase,
    delete: deleteUserUsecase,
}
