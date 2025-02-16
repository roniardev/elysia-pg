import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { verrou } from "@/utils/services/locks";

import { deletePostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const deletePost = new Elysia()
	.use(deletePostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.delete("/post/:id", async ({ bearer, set, jwtAccess, params }) => {
		await verrou.createLock("deletePost").run(async () => {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			// CHECK EXISTING DELETE POST PERMISSION
			const deletePermission = await db.query.permissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.name, "delete:post");
				},
			});

			const userPermission = await db.query.userPermissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return (
						eqFn(table.userId, validToken.id) &&
						eqFn(table.permissionId, deletePermission?.id as string) &&
						eqFn(table.revoked, false)
					);
				},
			});

			if (!userPermission) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized Permission",
				};
			}

			// CHECK EXISTING POST
			const existingPost = await db.query.posts.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, params.id);
				},
			});

			if (!existingPost) {
				set.status = 400;
				return {
					status: false,
					message: "Post not found",
				};
			}

			if (existingPost.userId !== validToken.id) {
				set.status = 400;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			// DELETE POST
			try {
				await db.delete(posts).where(eq(posts.id, params.id));
			} catch (error) {
				console.error(error);
				set.status = 500;
				return {
					status: false,
					message: "Failed to delete post",
					data: error,
				};
			}

			set.status = 200;
			return {
				status: true,
				message: "Post deleted",
			};
		});
	});
