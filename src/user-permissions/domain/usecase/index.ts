import { createUserPermissionUsecase } from "./create_user_permission_usecase"
import { deleteUserPermissionUsecase } from "./delete_user_permission_usecase"
import { getListUserPermissionUsecase } from "./get_list_user_permission_usecase"
import { getUserPermissionUsecase } from "./get_user_permission_usecase"
import { updateUserPermissionUsecase } from "./update_user_permission_usecase"

export const UserPermissionUsecase = {
    create: createUserPermissionUsecase,
    delete: deleteUserPermissionUsecase,
    get: getUserPermissionUsecase,
    getList: getListUserPermissionUsecase,
    update: updateUserPermissionUsecase,
}
