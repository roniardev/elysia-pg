import { Effect } from "effect"
import { ulid } from "ulid"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { posts } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"
import { PostsDatabaseService } from "@/src/posts/service/posts-database"

export type CreatePostInput = {
    title: string
    excerpt: string
    content: string
    status?: "draft" | "published"
    visibility?: "public" | "private"
    tags?: string
}

export const createPost = (input: CreatePostInput, userId: string) =>
    Effect.gen(function* () {
        const database = yield* PostsDatabaseService
        const postId = ulid()

        yield* Effect.tryPromise({
            try: () =>
                database.insert(posts).values({
                    id: postId,
                    userId,
                    title: input.title,
                    excerpt: input.excerpt,
                    content: input.content,
                }),
            catch: () =>
                new ServiceError(
                    ErrorMessage.INTERNAL_SERVER_ERROR,
                    ResponseErrorStatus.INTERNAL_SERVER_ERROR,
                ),
        })

        return {
            id: postId,
            title: input.title,
            excerpt: input.excerpt,
            content: input.content,
        }
    })
