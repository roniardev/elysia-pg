import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { PostPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import Sorting from "@/common/enum/sorting";
import { handleResponse } from "@/utils/handle-response";
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";

import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { readAllPostModel } from "../data/posts.model";
import { getScope } from "@/src/general/usecase/get-scope";
import { Scope } from "@/common/enum/scopes";

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
				return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			// CHECK EXISTING READ ALL POST PERMISSION
			const { valid, permission } = await verifyPermission(
				PostPermission.READ_ALL_POST,
				validToken.id,
			);

			if (!valid || !permission) {
				return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			const scope = await getScope(permission);

			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table, { eq }) => {
					return eq(table.id, validToken.id);
				},
			});

			if (!existingUser) {
				return handleResponse(ErrorMessage.INVALID_USER, () => {
					set.status = ResponseErrorStatus.BAD_REQUEST;
				});
			}

			// GET ALL POSTS
			const posts = await db.query.posts.findMany({
				where: (table, { eq, like, and }) => {
					if (scope === Scope.PERSONAL) {
						return and(
							eq(table.userId, validToken.id),
							search ? like(table.title, `%${search}%`) : undefined,
						);
					}

					return search ? like(table.title, `%${search}%`) : undefined;
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
				return handleResponse(ErrorMessage.PAGE_NOT_FOUND, () => {
					set.status = ResponseErrorStatus.BAD_REQUEST;
				});
			}
			const total = posts.length;

			return handleResponse(
				SuccessMessage.POSTS_FETCHED,
				() => {
					set.status = ResponseSuccessStatus.OK;
				},
				{
					data: posts,
				},
				{
					total: total,
					page: Number(page),
					limit: Number(limit),
					totalPage: totalPage,
				},
			);
		},
		{
			query: "readAllPostModel",
		},
	);
