import { Elysia } from "elysia";
import { readPostModel } from "../data/posts.model";
import { db } from "@/db";
import bearer from "@elysiajs/bearer";
import { posts } from "@/db/schema";
import { jwtAccessSetup } from "@/src/auth/setup/auth.setup";

export const readPost = new Elysia()
	.use(readPostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/post",
		async ({ bearer, set, jwtAccess, query }) => {
			const validToken = await jwtAccess.verify(bearer);
			const { page, limit } = query;

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

			const posts = await db.query.posts.findMany({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.userId, validToken.id);
				},
				limit: Number(limit),
				offset: (Number(page) - 1) * Number(limit),
				orderBy: (table, { desc: descFn }) => {
					return descFn(table.createdAt);
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
			query: "readPostModel",
		},
	);
