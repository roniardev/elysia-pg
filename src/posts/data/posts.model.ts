import { Elysia, t } from "elysia";

export const createPostModel = new Elysia().model({
	createPostModel: t.Object({
		title: t.String(),
		excerpt: t.String(),
		content: t.String(),
		status: t.Optional(t.String()),
		visibility: t.Optional(t.String()),
		tags: t.Optional(t.String()),
	}),
});

export const readPostModel = new Elysia().model({
	readPostModel: t.Object({
		page: t.Number(),
		limit: t.Number(),
	}),
});
