import { Elysia } from "elysia";

import { jwtAccessSetup } from "@/src/auth/setup/auth";
import bearer from "@elysiajs/bearer";

import { createPost } from "./usecase/create";
import { encryptResponse } from "@/utils/encrypt-response";
import { readAllPost } from "./usecase/read-all";
import { updatePost } from "./usecase/update";
import { deletePost } from "./usecase/delete";
import { readPost } from "./usecase/read";
import { verifyAuth } from "../general/usecase/verify-auth";
import { ErrorMessage } from "@/common/enum/response-message";

export const posts = new Elysia()
	.use(jwtAccessSetup)
	.use(bearer())
	.guard(
		{
			beforeHandle: async ({ bearer, jwtAccess, set }) => {
				const token = await jwtAccess.verify(bearer);
				let valid = false;
				let message = "";

				if (token && bearer) {
					const { valid: isAuthorized, message: authMessage } =
						await verifyAuth(bearer, token);
					valid = isAuthorized;
					message = authMessage;
				}

				if (!valid) {
					set.status = 401;
					return {
						status: false,
						message: ErrorMessage.UNAUTHORIZED,
					};
				}
			},
			afterHandle: ({ response, request }) => {
				console.log({
					from: "posts",
					response,
					request,
				});
				return encryptResponse(response);
			},
		},
		(app) =>
			app
				.use(createPost)
				.use(readAllPost)
				.use(deletePost)
				.use(readPost)
				.use(updatePost)
	);
