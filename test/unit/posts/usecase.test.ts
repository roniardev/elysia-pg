import { describe, expect, test } from "bun:test"
import { Effect } from "effect"

import {
    PostId,
    UserId,
} from "@/src/general/domain/entity_id"
import { IdGenerator } from "@/src/general/service/id_generator"
import type {
    Post,
} from "@/src/posts/domain/entity/post"
import {
    PostRepository,
    type PostRepositoryService,
} from "@/src/posts/domain/repository/post_repository"
import { createPostUsecase } from "@/src/posts/domain/usecase/create_post_usecase"
import { deletePostUsecase } from "@/src/posts/domain/usecase/delete_post_usecase"
import { getListPostUsecase } from "@/src/posts/domain/usecase/get_list_post_usecase"
import { getPostUsecase } from "@/src/posts/domain/usecase/get_post_usecase"

const post: Post = {
    id: PostId("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
    userId: UserId("01ARZ3NDEKTSV4RRFFQ69G5FAA"),
    title: "Effect graphs",
    excerpt: "Graph-first architecture",
    content: "Content",
    status: "draft",
    visibility: "private",
    tags: null,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    updatedAt: null,
    deletedAt: null,
}

const repository: PostRepositoryService = {
    getPostCount: () => Effect.succeed(1),
    createPost: (param) => Effect.succeed({
        id: param.id,
        title: param.title,
        excerpt: param.excerpt,
        content: param.content,
    }),
    deletePost: (_post: Post, _lockOwner: string) => Effect.void,
    getPostById: () => Effect.succeed(post),
    getOwnedPostById: () => Effect.succeed(post),
    getListPost: () =>
        Effect.succeed([{
            ...post,
            user: {
                id: post.userId,
            },
        }]),
    updatePost: () => Effect.succeed(null),
}

describe("Post use cases", () => {
    test("creates with replaceable ID and repository requirements", async () => {
        const result = await createPostUsecase({
            title: post.title,
            excerpt: post.excerpt,
            content: post.content,
        }, post.userId).pipe(
            Effect.provideService(IdGenerator, {
                generate: Effect.succeed(post.id),
            }),
            Effect.provideService(PostRepository, repository),
            Effect.runPromise,
        )

        expect(result.id).toBe(post.id)
    })

    test("reads through the scoped repository requirement", async () => {
        const result = await getPostUsecase(post.id, post.userId, "personal").pipe(
            Effect.provideService(PostRepository, repository),
            Effect.runPromise,
        )

        expect(result).toEqual(post)
    })

    test("reads a page through the same graph", async () => {
        const result = await getListPostUsecase({
            page: 1,
            limit: 10,
        }, post.userId, "personal").pipe(
            Effect.provideService(PostRepository, repository),
            Effect.runPromise,
        )

        expect(result.data[0]?.id).toBe(post.id)
    })

    test("rejects page zero before persistence", async () => {
        const result = await getListPostUsecase({
            page: 0,
            limit: 10,
        }, post.userId, null).pipe(
            Effect.provideService(PostRepository, repository),
            Effect.either,
            Effect.runPromise,
        )

        expect(result._tag).toBe("Left")
    })

    test("deletes through the owned-post capability", async () => {
        const result = await deletePostUsecase(post.id, post.userId).pipe(
            Effect.provideService(PostRepository, repository),
            Effect.runPromise,
        )

        expect(result.id).toBe(post.id)
    })
})
