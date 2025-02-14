import { Elysia } from "elysia";
import { readAllPostModel } from "../data/posts.model";
import { db } from "@/db";
import bearer from "@elysiajs/bearer";
import { jwtAccessSetup } from "@/src/auth/setup/auth.setup";

export const readAllPost = new Elysia()
	.use(readAllPostModel)
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

			const readAllPermission = await db.query.permissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.name, "read-all:post");
				},
			});

			const userPermission = await db.query.userPermissions.findFirst({
				where: (table, { eq: eqFn }) => {
					return (
						eqFn(table.userId, validToken.id) &&
						eqFn(table.permissionId, readAllPermission?.id as string) &&
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
