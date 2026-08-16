import { Elysia } from "elysia"

import { createPost } from "@/src/posts/usecase/create"
import { deletePost } from "@/src/posts/usecase/delete"
import { readPost } from "@/src/posts/usecase/read"
import { readAllPost } from "@/src/posts/usecase/read-all"
import { updatePost } from "@/src/posts/usecase/update"

export const posts = new Elysia()
    .use(createPost)
    .use(readAllPost)
    .use(deletePost)
    .use(readPost)
    .use(updatePost)
