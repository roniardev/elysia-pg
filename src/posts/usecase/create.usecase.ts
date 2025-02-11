import { Elysia } from "elysia";
import { createPostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth.setup";
import { db } from "@/db";
import { posts } from "@/db/schema";
import bearer from "@elysiajs/bearer";
import { generateId } from "lucia";

export const createPost = new Elysia()
	.use(createPostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/post",
		async ({ body, bearer, set, jwtAccess }) => {
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

			const postId = generateId(21);

			try {
				await db.insert(posts).values({
					id: postId,
					userId: existingUser.id,
					title: body.title,
					excerpt: body.excerpt,
					content: body.content,
				});
			} catch (error) {
				set.status = 400;
				return {
					message: "Failed to create post",
				};
			}

			set.status = 201;

			const response = {
				id: postId,
				title: body.title,
				excerpt: body.excerpt,
				content: body.content,
			};

			return {
				status: true,
				message: "Post created",
				data: response,
			};
		},
		{
			body: "createPostModel",
		},
	);
