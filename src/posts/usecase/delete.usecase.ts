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
	.delete("/post/:id", async ({ bearer, set, jwtAccess, params }) => {
		const validToken = await jwtAccess.verify(bearer);

		if (!validToken) {
			set.status = 403;
			return {
				status: false,
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

		const deletePost = await db.delete(posts).where(eq(posts.id, params.id));

		if (!deletePost) {
			set.status = 400;
			return {
				status: false,
				message: "Failed to delete post",
			};
		}

		return {
			status: true,
			message: "Post deleted",
		};
	});
