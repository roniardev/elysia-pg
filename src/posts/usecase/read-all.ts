import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { PostPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import Sorting from "@/common/enum/sorting";

import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { readAllPostModel } from "../data/posts.model";
import { and, eq, like } from "drizzle-orm";

export const readAllPost = new Elysia()
	.use(readAllPostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/post",
		async ({ bearer, set, jwtAccess, query }) => {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);
			const { page, limit, sort, search } = query;

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			// CHECK EXISTING READ ALL POST PERMISSION
			const { valid } = await verifyPermission(
				PostPermission.READ_ALL_POST,
				validToken.id,
			);

			if (!valid) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized Permission",
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
					status: false,
					message: "Invalid User",
				};
			}

			// GET ALL POSTS
			const posts = await db.query.posts.findMany({
				where: (table) => {
					return and(
						eq(table.userId, validToken.id),
						search ? like(table.title, `%${search}%`) : undefined,
					);
				},
				limit: Number(limit),
				offset: (Number(page) - 1) * Number(limit),
				orderBy: (table, { desc: descFn, asc: ascFn }) => {
					if (sort === Sorting.ASC) {
						return ascFn(table.createdAt);
					}
					return descFn(table.createdAt);
				},
				with: {
					user: {
						columns: {
							id: true,
						},
					},
				},
			});

			const totalPage = Math.ceil(posts.length / Number(limit));

			if (page > totalPage) {
				set.status = 400;
				return {
					status: false,
					message: "Page not found",
				};
			}
			const total = posts.length;

			return {
				status: true,
				message: "Posts fetched successfully",
				data: posts,
				total: total,
				page: Number(page),
				limit: Number(limit),
				totalPage: totalPage,
			};
		},
		{
			query: "readAllPostModel",
		},
	);
