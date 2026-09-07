import { Elysia } from "elysia"

import { createPost } from "@/src/posts/delivery/presenter/http/create_post"
import { deletePost } from "@/src/posts/delivery/presenter/http/delete_post"
import { getListPosts } from "@/src/posts/delivery/presenter/http/get_list_posts"
import { getPost } from "@/src/posts/delivery/presenter/http/get_post"
import { updatePost } from "@/src/posts/delivery/presenter/http/update_post"

export const posts = new Elysia()
    .use(createPost)
    .use(getListPosts)
    .use(deletePost)
    .use(getPost)
    .use(updatePost)
