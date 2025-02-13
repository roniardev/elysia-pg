import { Elysia } from "elysia";
import { deletePostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth.setup";
import bearer from "@elysiajs/bearer";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const deletePost = new Elysia()
	.use(deletePostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.delete(
		"/post/:id",
		async ({ query, bearer, set, jwtAccess }) => {
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				set.status = 403;
				return {
					message: "Unauthorized",
				};
			}

			const deletePermission = await db.query.permissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.name, "delete:post");
				},
			});

			const userPermission = await db.query.userPermissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return (
						eqFn(table.userId, validToken.id) &&
						eqFn(table.permissionId, deletePermission?.id as string)
					);
				},
			});

			if (!userPermission) {
				set.status = 403;
				return {
					message: "Unauthorized Permission",
				};
			}

			const existingPost = await db.query.posts.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, query.id);
				},
			});

			if (!existingPost) {
				set.status = 400;
				return {
					message: "Post not found",
				};
			}

			if (existingPost.userId !== validToken.id) {
				set.status = 400;
				return {
					message: "Unauthorized",
				};
			}

			const deletePost = await db.delete(posts).where(eq(posts.id, query.id));

			if (!deletePost) {
				set.status = 400;
				return {
					message: "Failed to delete post",
				};
			}

			return {
				message: "Post deleted",
			};
		},
		{
			query: "deletePostModel",
		},
	);
