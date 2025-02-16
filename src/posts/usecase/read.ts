import { Elysia } from "elysia";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { jwtAccessSetup } from "@/src/auth/setup/auth";
import { verifyPermission } from "@/src/general/usecase/verify-permission";
import { PostPermission } from "@/common/enum/permissions";

export const readPost = new Elysia()
	.use(jwtAccessSetup)
	.use(bearer())
	.get("/post/:id", async ({ params, bearer, set, jwtAccess }) => {
		// CHECK VALID TOKEN
		const validToken = await jwtAccess.verify(bearer);

		if (!validToken) {
			set.status = 403;
			return {
				status: false,
				message: "Unauthorized",
			};
		}

		// CHECK EXISTING USER
		const existingUser = await db.query.users.findFirst({
			where: (table, { eq: eqFn }) => {
				return eqFn(table.id, validToken.id);
			},
		});

		// CHECK EXISTING READ POST PERMISSION
		const { valid } = await verifyPermission(
			PostPermission.READ_POST,
			validToken.id,
		);

		if (!valid) {
			set.status = 403;
			return {
				status: false,
				message: "Unauthorized Permission",
			};
		}

		if (!existingUser) {
			set.status = 400;
			return {
				status: false,
				message: "Invalid User",
			};
		}

		// READ POST
		const post = await db.query.posts.findFirst({
			where: (table, { eq: eqFn }) => {
				return eqFn(table.id, params.id);
			},
		});

		if (!post) {
			set.status = 400;
			return {
				status: false,
				message: "Post not found",
			};
		}

		if (post.userId !== existingUser.id) {
			set.status = 400;
			return {
				status: false,
				message: "Invalid User",
			};
		}

		const readPost = await db.query.posts.findFirst({
			where: (table, { eq: eqFn }) => {
				return eqFn(table.id, params.id);
			},
		});

		if (!readPost) {
			set.status = 400;
			return {
				status: false,
				message: "Failed to read post",
			};
		}

		return {
			status: true,
			message: "Post read successfully",
			data: readPost,
		};
	});
