import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";
import { ulid } from "ulid";

import { db } from "@/db";
import { posts } from "@/db/schema";
import { PostPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { handleResponse } from "@/utils/handle-response";
import {
	ResponseErrorStatus,
	ResponseSuccessStatus,
} from "@/common/enum/response-status";
import { ErrorMessage, SuccessMessage } from "@/common/enum/response-message";


import { createPostModel } from "../data/posts.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";


export const createPost = new Elysia()
	.use(createPostModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.post(
		"/post",
		async ({ body, bearer, set, jwtAccess }) => {
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				return handleResponse(ErrorMessage.UNAUTHORIZED, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table, { eq, and, isNull }) => {
					return and(eq(table.id, validToken.id), isNull(table.deletedAt));
				},
			});

			if (!existingUser) {
				return handleResponse(ErrorMessage.INVALID_USER, () => {
					set.status = ResponseErrorStatus.BAD_REQUEST;
				});
			}

			const { valid } = await verifyPermission(
				PostPermission.CREATE_POST,
				existingUser.id,
			);

			if (!valid) {
				return handleResponse(ErrorMessage.UNAUTHORIZED_PERMISSION, () => {
					set.status = ResponseErrorStatus.FORBIDDEN;
				});
			}

			// CREATE POST
			const postId = ulid();

			try {
				await db.insert(posts).values({
					id: postId,
					userId: existingUser.id,
					title: body.title,
					excerpt: body.excerpt,
					content: body.content,
				});
			} catch (error) {
				console.error(error);
				return handleResponse(ErrorMessage.INTERNAL_SERVER_ERROR, () => {
					set.status = ResponseErrorStatus.INTERNAL_SERVER_ERROR;
				});
			}

			const response = {
				id: postId,
				title: body.title,
				excerpt: body.excerpt,
				content: body.content,
			};

			return handleResponse(
				SuccessMessage.POST_CREATED,
				() => {
					set.status = ResponseSuccessStatus.CREATED;
				},
				response,
			);
		},
		{
			body: "createPostModel",
		},
	);
