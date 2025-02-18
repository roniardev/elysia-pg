import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { PostPermission } from "@/common/enum/permissions";
import type { Post } from "@/db/schema";

import { readPostModel } from "../data/posts.model";
import { getScope } from "@/src/general/usecase/get-scope";
import { Scope } from "@/common/enum/scopes";

export const readPost = new Elysia()
	.use(readPostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/post/:id",
		async ({ params, bearer, set, jwtAccess }) => {
			// HANDLE PUBLIC POST
			let publicPost: Post | undefined = undefined;

			if (!bearer) {
				publicPost = await db.query.posts.findFirst({
					where: (table, { eq, and }) =>
						and(eq(table.id, params.id), eq(table.visibility, "public")),
				});
			}

			if (!bearer && publicPost) {
				return {
					status: true,
					message: "Post read successfully",
					data: publicPost,
				};
			}

			if (!bearer && !publicPost) {
				set.status = 400;
				return {
					status: false,
					message: "Post not found",
				};
			}

			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			// CHECK EXISTING READ POST PERMISSION
			const { valid, permission } = await verifyPermission(
				PostPermission.READ_POST,
				validToken.id,
			);

			if (!valid || !permission) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized Permission",
				};
			}

			const scope = await getScope(permission);

			// READ POST
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
					status: false,
					message: "Post not found",
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
					status: false,
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
