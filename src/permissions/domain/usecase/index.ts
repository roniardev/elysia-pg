import { createPermissionUsecase } from "@/src/permissions/domain/usecase/create_permission_usecase"
import { deletePermissionUsecase } from "@/src/permissions/domain/usecase/delete_permission_usecase"
import { getListPermissionUsecase } from "@/src/permissions/domain/usecase/get_list_permission_usecase"
import { getPermissionUsecase } from "@/src/permissions/domain/usecase/get_permission_usecase"
import { updatePermissionUsecase } from "@/src/permissions/domain/usecase/update_permission_usecase"

export const PermissionUsecase = {
    create: createPermissionUsecase,
    get: getPermissionUsecase,
    getList: getListPermissionUsecase,
    update: updatePermissionUsecase,
    delete: deletePermissionUsecase,
}
