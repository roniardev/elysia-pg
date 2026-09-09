import type { PostId, UserId } from "@/src/general/domain/entity_id"
import type { SortDirection } from "@/src/general/domain/sort_direction"
import type { AuthorizationScope } from "@/src/authorization/domain/entity/authorization"

export type PostStatus = "draft" | "published"
export type PostVisibility = "private" | "public"

export type Post = {
    content: string
    createdAt: Date
    deletedAt: Date | null
    excerpt: string
    id: PostId
    status: PostStatus
    tags: string | null
    title: string
    updatedAt: Date | null
    userId: UserId
    visibility: PostVisibility
}

export type PostWithUser = Post & {
    user: {
        id: UserId
    }
}

export type CreatePostParam = {
    content: string
    excerpt: string
    status?: PostStatus
    tags?: string
    title: string
    visibility?: PostVisibility
}

export type CreatePostRecord = CreatePostParam & {
    id: PostId
    userId: UserId
}

export type CreatedPost = {
    content: string
    excerpt: string
    id: PostId
    title: string
}

export type PostListQuery = {
    limit: number
    page: number
    search?: string
    sort?: SortDirection
}

export type PostScope = {
    scope: AuthorizationScope | null
    userId: UserId
}

export type UpdatePostParam = {
    content?: string
    excerpt?: string
    status?: PostStatus
    tags?: string
    title?: string
    visibility?: PostVisibility
}

export type UpdatedPost = {
    content: string
    createdAt: string
    excerpt: string
    id: PostId
    status: PostStatus
    tags: string | null
    title: string
    updatedAt: string | null
    visibility: PostVisibility
}
