import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";

import { readAllPostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const readAllPost = new Elysia()
	.use(readAllPostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/post",
		async ({ bearer, set, jwtAccess, query }) => {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);
			const { page, limit } = query;

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			// CHECK EXISTING READ ALL POST PERMISSION
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
