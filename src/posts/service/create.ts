import { Effect } from "effect"
import { ulid } from "ulid"

import { ErrorMessage } from "@/common/enum/response-message"
import { ResponseErrorStatus } from "@/common/enum/response-status"
import { db } from "@/db"
import { posts } from "@/db/schema"
import { ServiceError } from "@/src/general/service-error"

export type CreatePostInput = {
    title: string
    excerpt: string
    content: string
    status?: "draft" | "published"
    visibility?: "public" | "private"
    tags?: string
}

export const createPost = (input: CreatePostInput, userId: string) =>
    Effect.tryPromise({
        try: async () => {
            const postId = ulid()

            await db.insert(posts).values({
                id: postId,
                userId,
                title: input.title,
                excerpt: input.excerpt,
                content: input.content,
            })

            return {
                id: postId,
                title: input.title,
                excerpt: input.excerpt,
                content: input.content,
            }
        },
        catch: (error) => {
            console.error(error)
            return new ServiceError(
                ErrorMessage.INTERNAL_SERVER_ERROR,
                ResponseErrorStatus.INTERNAL_SERVER_ERROR,
            )
        },
    })
