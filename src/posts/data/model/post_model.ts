import type { Post as PostRow } from "@/db/schema"
import {
    PostId,
    UserId,
} from "@/src/general/domain/entity_id"
import type {
    Post,
    UpdatedPost,
} from "@/src/posts/domain/entity/post"

export const toPost = (row: PostRow): Post => ({
    ...row,
    id: PostId(row.id),
    userId: UserId(row.userId),
})

export const toUpdatedPost = (post: Post): UpdatedPost => ({
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    content: post.content,
    status: post.status,
    visibility: post.visibility,
    tags: post.tags,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt?.toISOString() ?? null,
})
