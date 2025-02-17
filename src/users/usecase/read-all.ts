import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { UserPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";

import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { readAllUserModel } from "../data/users.model";

export const readAllUser = new Elysia()
	.use(readAllUserModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/user",
		async ({ bearer, set, jwtAccess, query }) => {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			const { limit, page } = query;

			const { valid } = await verifyPermission(
				UserPermission.READ_ALL_USER,
				validToken.id,
			);

			if (!valid) {
				set.status = 403;
				return {
					status: false,
					message: "Invalid Permission",
				};
			}

			const users = await db.query.users.findMany({
				with: {
					permissions: true,
				},
			});

			if (!users) {
				set.status = 404;
				return {
					status: false,
					message: "Users not found",
				};
			}

			const totalPage = Math.ceil(users.length / Number(limit));

			if (page > totalPage) {
				set.status = 400;
				return {
					status: false,
					message: "Page not found",
				};
			}

			const total = users.length;

			return {
				status: true,
				message: "Users fetched successfully",
				data: users,
				total: total,
				page: Number(page),
				limit: Number(limit),
				totalPage: totalPage,
			};
		},
		{
			query: "readAllUserModel",
		},
	);
