import { createPost } from "@/src/posts/service/create"
import { deletePost } from "@/src/posts/service/delete"
import { readPost } from "@/src/posts/service/read"
import { readAllPost } from "@/src/posts/service/read-all"
import { updatePost } from "@/src/posts/service/update"

export const PostService = {
    create: createPost,
    read: readPost,
    readAll: readAllPost,
    update: updatePost,
    delete: deletePost,
}
