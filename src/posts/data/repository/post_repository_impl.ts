import { Effect, Layer } from "effect"

import type { Database } from "@/db/database"
import {
    toPost,
    toUpdatedPost,
} from "@/src/posts/data/model/post_model"
import { UserId } from "@/src/general/domain/entity-id"
import { getPostCount } from "@/src/posts/data/source/count_posts"
import { createPost } from "@/src/posts/data/source/create_post"
import { deletePost } from "@/src/posts/data/source/delete_post"
import { getOwnedPostById } from "@/src/posts/data/source/find_owned_post_by_id"
import { getPostById } from "@/src/posts/data/source/find_post_by_id"
import { getListPosts } from "@/src/posts/data/source/list_posts"
import { updatePost } from "@/src/posts/data/source/update_post"
import {
    PostRepository,
    PostRepositoryError,
} from "@/src/posts/domain/repository/post_repository"
import type { Locks } from "@/utils/services/lock-manager"

const repositoryError =
    (operation: PostRepositoryError["operation"]) => (cause: unknown) =>
        new PostRepositoryError({ cause, operation })

export const makePostRepositoryLayer = (
    database: Database,
    locks: Locks,
) => Layer.succeed(PostRepository, {
    getPostCount: (param, scope) =>
        Effect.tryPromise({
            try: () => getPostCount(database, param, scope),
            catch: repositoryError("getPostCount"),
        }),
    createPost: (param) =>
        Effect.tryPromise({
            try: async () => {
                await createPost(database, param)
                return {
                    id: param.id,
                    title: param.title,
                    excerpt: param.excerpt,
                    content: param.content,
                }
            },
            catch: repositoryError("createPost"),
        }),
    deletePost: (post, lockOwner) =>
        Effect.tryPromise({
            try: async () => {
                await deletePost(database, locks, post, lockOwner)
            },
            catch: repositoryError("deletePost"),
        }),
    getPostById: (id, scope) =>
        Effect.tryPromise({
            try: async () => {
                const row = await getPostById(database, id, scope)

                if (!row) {
                    return null
                }

                return toPost(row)
            },
            catch: repositoryError("getPostById"),
        }),
    getOwnedPostById: (id, userId) =>
        Effect.tryPromise({
            try: async () => {
                const row = await getOwnedPostById(database, id, userId)

                if (!row) {
                    return null
                }

                return toPost(row)
            },
            catch: repositoryError("getOwnedPostById"),
        }),
    getListPost: (param, scope) =>
        Effect.tryPromise({
            try: async () => {
                const rows = await getListPosts(database, param, scope)
                return rows.map((row) => ({
                    ...toPost(row),
                    user: {
                        id: UserId(row.user.id),
                    },
                }))
            },
            catch: repositoryError("getListPost"),
        }),
    updatePost: (post, param, lockOwner) =>
        Effect.tryPromise({
            try: async () => {
                const result = await updatePost(
                    database,
                    locks,
                    post,
                    param,
                    lockOwner,
                )
                const didAcquire = result[0]
                const row = result[1]

                if (!didAcquire || !row) {
                    return null
                }

                return toUpdatedPost(toPost(row))
            },
            catch: repositoryError("updatePost"),
        }),
})
