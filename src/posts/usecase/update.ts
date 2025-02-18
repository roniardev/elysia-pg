import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { verrou } from "@/utils/services/locks";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { getScope } from "@/src/general/usecase/get-scope";

import { updatePostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { PostPermission } from "@/common/enum/permissions";
import { Scope } from "@/common/enum/scopes";

export const updatePost = new Elysia()
	.use(updatePostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.put(
		"/post/:id",
		async ({ body, params, bearer, set, jwtAccess }) => {
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

			// CHECK EXISTING UPDATE POST PERMISSION
			const { valid, permission } = await verifyPermission(
				PostPermission.UPDATE_POST,
				validToken.id,
			);

			if (!valid || !permission) {
				set.status = 403;
				return {
					message: "Unauthorized Permission",
				};
			}

			const scope = await getScope(permission);

			if (!existingUser) {
				set.status = 400;
				return {
					message: "Invalid User",
				};
			}

			// CHECK EXISTING POST
			const post = await db.query.posts.findFirst({
				where: (table, { eq, and }) => {
					if (scope === Scope.PERSONAL) {
						return and(
							eq(table.id, params.id),
							eq(table.userId, validToken.id),
						);
					}
					return eq(table.id, params.id);
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

			await verrou.createLock(`updatePost-${post.id}`).run(async () => {
				// UPDATE POST
				try {
					await db
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
				} catch (error) {
					console.error(error);
					set.status = 500;
					return {
						status: false,
						message: "Failed to update post",
						data: error,
					};
				}
			});

			return {
				status: true,
				message: "Post updated successfully",
			};
		},
		{
			body: "updatePostModel",
		},
	);
