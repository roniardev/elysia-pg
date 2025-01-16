import { Elysia, t } from "elysia";
import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth.setup";
import { db } from "@/db";
import { refreshToken, sessions } from "@/db/schema";
import bearer from "@elysiajs/bearer";

export const logout = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.use(bearer())
	.post(
		"/logout",
		async function handler({
			body,
			set,
			jwtAccess,
			jwtRefresh,
			headers,
			server,
			request,
		}) {
			set.status = 202;
		},
		{
			beforeHandle: async ({
				jwtAccess,
				set,
				cookie: { auth },
				bearer,
				request,
			}) => {
				console.log("bear", bearer);
				const valid = await jwtAccess.verify(bearer);
				console.log("valid", valid);
				if (!valid) {
					set.status = 401;
					return {
						message: "Unauthorized",
					};
				}
			},
		},
	);
