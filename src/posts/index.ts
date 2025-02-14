import { Elysia } from "elysia";
import { jwtAccessSetup, jwtRefreshSetup } from "@/src/auth/setup/auth.setup";
import { verifyJWT } from "../auth/usecase/verify-jwt.usecase";
import { createPost } from "./usecase/create.usecase";
import { encryptResponse } from "@/utils/encrypt-response";
import type { GeneralResponse } from "@/common/model/general-response";
import { readAllPost } from "./usecase/read-all.usecase";
import { updatePost } from "./usecase/update.usecase";
import { deletePost } from "./usecase/delete.usecase";
import { readPost } from "./usecase/read.usecase";

export const posts = new Elysia()
	.onAfterHandle(
		({
			response,
			request,
		}: {
			response: GeneralResponse;
			request: Request;
		}) => {
			console.log({
				from: "posts",
				response,
				request,
			});
			return encryptResponse(response);
		},
	)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.use(verifyJWT)
	.use(createPost)
	.use(readAllPost)
	.use(readPost)
	.use(updatePost)
	.use(deletePost);
