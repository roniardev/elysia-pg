import { Elysia } from "elysia";
import { jwtAccessSetup, jwtRefreshSetup } from "@/src/auth/setup/auth.setup";
import { verifyJWT } from "../auth/usecase/verify-jwt.usecase";
import { createPost } from "./usecase/create.usecase";
import { encryptResponse } from "@/utils/encrypt-response";
import type { GeneralResponse } from "@/common/model/general-response";
import { readPost } from "./usecase/read-all.usecase";

export const posts = new Elysia()
	.onAfterHandle(
		({
			response,
		}: {
			response: GeneralResponse;
		}) => {
			return encryptResponse(response);
		},
	)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.use(verifyJWT)
	.use(createPost)
	.use(readPost);
