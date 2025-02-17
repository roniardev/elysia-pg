import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { UserPermission } from "@/common/enum/permissions";

import { readUserModel } from "../data/users.model";

export const readUser = new Elysia()
	.use(readUserModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.get(
		"/user/:id",
		async ({ params, bearer, set, jwtAccess }) => {
			const validToken = await jwtAccess.verify(bearer);

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			const { valid } = await verifyPermission(
				UserPermission.READ_USER,
				validToken.id,
			);

			if (!valid) {
				set.status = 403;
				return {
					status: false,
					message: "Invalid Permission",
				};
			}

			const user = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, params.id);
				},
				with: {
					permissions: true,
				},
			});

			if (!user) {
				set.status = 404;
				return {
					status: false,
					message: "User not found",
				};
			}

			const data = {
				id: user.id,
				email: user.email,
				emailVerified: user.emailVerified,
				permissions: user.permissions,
			};

			set.status = 200;

			return {
				status: true,
				message: "User found",
				data: data,
			};
		},
		{
			params: "readUserModel",
		},
	);