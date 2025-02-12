import { Elysia } from "elysia";
import { updatePostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth.setup";
import bearer from "@elysiajs/bearer";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const updatePost = new Elysia()
	.use(updatePostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.put(
		"/post/:id",
		async ({ body, params, bearer, set, jwtAccess }) => {
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				set.status = 403;
				return {
					message: "Unauthorized",
				};
			}

			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, validToken.id);
				},
			});

			if (!existingUser) {
				set.status = 400;
				return {
					message: "Invalid User",
				};
			}

			const post = await db.query.posts.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, params.id);
				},
			});

			console.log(post);

			if (!post) {
				set.status = 400;
				return {
					message: "Post not found",
				};
			}

			if (post.userId !== existingUser.id) {
				set.status = 400;
				return {
					message: "Invalid User",
				};
			}

			const updatePost = await db
				.update(posts)
				.set({
					title: body.title || post.title,
					excerpt: body.excerpt || post.excerpt,
					content: body.content || post.content,
					status:
						(body.status as "draft" | "published") ||
						(post.status as "draft" | "published"),
					visibility:
						(body.visibility as "public" | "private") ||
						(post.visibility as "public" | "private"),
					tags: body.tags || post.tags,
					updatedAt: new Date(),
				})
				.where(eq(posts.id, params.id));

			if (!updatePost) {
				set.status = 400;
				return {
					message: "Failed to update post",
				};
			}

			return {
				message: "Post updated successfully",
			};
		},
		{
			body: "updatePostModel",
		},
	);
