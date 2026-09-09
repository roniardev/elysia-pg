import { Context, Data, type Effect } from "effect"

import type {
    CreatePostRecord,
    CreatedPost,
    Post,
    PostListQuery,
    PostScope,
    PostWithUser,
    UpdatedPost,
    UpdatePostParam,
} from "@/src/posts/domain/entity/post"
import type { PostId, UserId } from "@/src/general/domain/entity_id"

export class PostRepositoryError extends Data.TaggedError(
    "PostRepositoryError",
)<{
        cause: unknown
        operation:
            | "getPostCount"
            | "createPost"
            | "deletePost"
            | "getPostById"
            | "getOwnedPostById"
            | "getListPost"
            | "updatePost"
    }> {}

export type PostRepositoryService = {
    getPostCount: (
        param: PostListQuery,
        scope: PostScope,
    ) => Effect.Effect<number, PostRepositoryError>
    createPost: (
        param: CreatePostRecord,
    ) => Effect.Effect<CreatedPost, PostRepositoryError>
    deletePost: (
        post: Post,
        lockOwner: string,
    ) => Effect.Effect<void, PostRepositoryError>
    getPostById: (
        id: PostId,
        scope: PostScope,
    ) => Effect.Effect<Post | null, PostRepositoryError>
    getOwnedPostById: (
        id: PostId,
        userId: UserId,
    ) => Effect.Effect<Post | null, PostRepositoryError>
    getListPost: (
        param: PostListQuery,
        scope: PostScope,
    ) => Effect.Effect<PostWithUser[], PostRepositoryError>
    updatePost: (
        post: Post,
        param: UpdatePostParam,
        lockOwner: string,
    ) => Effect.Effect<UpdatedPost | null, PostRepositoryError>
}

export const PostRepository =
    Context.GenericTag<PostRepositoryService>("PostRepository")
