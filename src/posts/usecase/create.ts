import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";
import { ulid } from "ulid";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { PostPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";

import { createPostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const createPost = new Elysia()
	.use(createPostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/post",
		async ({ body, bearer, set, jwtAccess }) => {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				set.status = 403;
				return {
					message: "Unauthorized",
				};
			}

			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table) => {
					return and(eq(table.id, validToken.id), isNull(table.deletedAt));
				},
			});

			if (!existingUser) {
				set.status = 400;
				return {
					message: "Invalid User",
				};
			}

			const { valid } = await verifyPermission(
				PostPermission.CREATE_POST,
				existingUser.id,
			);

			if (!valid) {
				set.status = 403;
				return {
					message: "Unauthorized Permission",
				};
			}

			// CREATE POST
			const postId = ulid();

			try {
				await db.insert(posts).values({
					id: postId,
					userId: existingUser.id,
					title: body.title,
					excerpt: body.excerpt,
					content: body.content,
				});
			} catch (error) {
				console.error(error);
				set.status = 500;
				return {
					message: "Failed to create post",
					data: error,
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
