export { createPostUsecase } from "./create_post_usecase"
export { deletePostUsecase } from "./delete_post_usecase"
export { getListPostUsecase } from "./get_list_post_usecase"
export { getPostUsecase } from "./get_post_usecase"
export { updatePostUsecase } from "./update_post_usecase"

import { createPostUsecase } from "./create_post_usecase"
import { deletePostUsecase } from "./delete_post_usecase"
import { getListPostUsecase } from "./get_list_post_usecase"
import { getPostUsecase } from "./get_post_usecase"
import { updatePostUsecase } from "./update_post_usecase"

export const PostUsecase = {
    create: createPostUsecase,
    delete: deletePostUsecase,
    get: getPostUsecase,
    getList: getListPostUsecase,
    update: updatePostUsecase,
}
