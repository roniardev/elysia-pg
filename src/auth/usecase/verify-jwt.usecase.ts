import { Elysia, t } from "elysia";
import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth.setup";
import bearer from "@elysiajs/bearer";

export const verifyJWT = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.use(bearer())
	.onBeforeHandle(async ({ jwtAccess, set, bearer }) => {
		const validToken = await jwtAccess.verify(bearer);
		if (!validToken) {
			set.status = 401;
			return {
				message: "Unauthorized",
			};
		}
	});
