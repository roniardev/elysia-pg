import { Elysia } from "elysia";
import { generateId } from "lucia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { posts } from "@/db/schema";

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

			// CHECK EXISTING CREATE POST PERMISSION
			const createPermission = await db.query.permissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.name, "create:post");
				},
			});

			const userPermission = await db.query.userPermissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return (
						eqFn(table.userId, existingUser.id) &&
						eqFn(table.permissionId, createPermission?.id as string) &&
						eqFn(table.revoked, false)
					);
				},
			});

			if (!userPermission) {
				set.status = 403;
				return {
					message: "Unauthorized Permission",
				};
			}

			// CREATE POST
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
