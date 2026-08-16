import { Elysia, t } from "elysia"

import { ULID_PATTERN } from "@/utils/ulid"

export const createPostModel = new Elysia().model({
    createPostModel: t.Object({
        title: t.String(),
        excerpt: t.String(),
        content: t.String(),
        status: t.Optional(
            t.Union([t.Literal("draft"), t.Literal("published")]),
        ),
        visibility: t.Optional(
            t.Union([t.Literal("public"), t.Literal("private")]),
        ),
        tags: t.Optional(t.String()),
    }),
})

export const readAllPostModel = new Elysia().model({
    readAllPostModel: t.Object({
        page: t.Integer({ minimum: -1 }),
        limit: t.Integer({ minimum: 1, maximum: 100 }),
        sort: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
        search: t.Optional(t.String({ maxLength: 255 })),
    }),
})

export const updatePostModel = new Elysia().model({
    updatePostModel: t.Object({
        title: t.Optional(t.String()),
        excerpt: t.Optional(t.String()),
        content: t.Optional(t.String()),
        status: t.Optional(
            t.Union([t.Literal("draft"), t.Literal("published")]),
        ),
        visibility: t.Optional(
            t.Union([t.Literal("public"), t.Literal("private")]),
        ),
        tags: t.Optional(t.String()),
    }),
})

export const deletePostModel = new Elysia().model({
    deletePostModel: t.Object({
        id: t.String({ pattern: ULID_PATTERN }),
    }),
})

export const readPostModel = new Elysia().model({
    readPostModel: t.Object({
        id: t.String({ pattern: ULID_PATTERN }),
    }),
})
