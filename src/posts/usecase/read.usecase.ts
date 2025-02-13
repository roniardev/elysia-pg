import { Elysia } from "elysia";
import { readPostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth.setup";
import bearer from "@elysiajs/bearer";
import { db } from "@/db";
import { posts } from "@/db/schema";
import { eq } from "drizzle-orm";

export const readPost = new Elysia()
	.use(readPostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.put(
		"/post/:id",
		async ({ params, bearer, set, jwtAccess }) => {
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

			const readPermission = await db.query.permissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.name, "read:post");
				},
			});

			const userPermission = await db.query.userPermissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return (
						eqFn(table.userId, validToken.id) &&
						eqFn(table.permissionId, readPermission?.id as string)
					);
				},
			});

			if (!userPermission) {
				set.status = 403;
				return {
					message: "Unauthorized Permission",
				};
			}

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

			const readPost = await db.query.posts.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, params.id);
				},
			});

			if (!readPost) {
				set.status = 400;
				return {
					message: "Failed to read post",
				};
			}

			return {
				status: true,
				message: "Post read successfully",
				data: readPost,
			};
		},
		{
			params: "readPostModel",
		},
	);
