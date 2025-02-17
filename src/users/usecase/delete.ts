import { Elysia } from "elysia";
import { eq } from "drizzle-orm";
import bearer from "@elysiajs/bearer";

import { db } from "@/db";
import { users } from "@/db/schema";
import { verrou } from "@/utils/services/locks";
import { UserPermission } from "@/common/enum/permissions";
import { verifyPermission } from "@/src/general/usecase/verify-permission";

import { deleteUserModel } from "../data/users.model";
import { jwtAccessSetup } from "@/src/auth/setup/auth";

export const deleteUser = new Elysia()
	.use(deleteUserModel)
	.use(jwtAccessSetup)
	.use(bearer())
	.delete(
		"/user/:id",
		async ({ bearer, set, jwtAccess, params }) => {
			// CHECK VALID TOKEN
			const validToken = await jwtAccess.verify(bearer);

			const lock = verrou.createLock(`user:${params.id}`);
			const acquired = await lock.acquire();

			try {
				// await 15s
				console.log("Acquire lock");
				await new Promise((resolve) => setTimeout(resolve, 15000));
			} finally {
				console.log("Release lock");
				await lock.release();
			}

			if (!acquired) {
				set.status = 429;
				return {
					status: false,
					message: "Too many requests",
				};
			}

			if (!validToken) {
				set.status = 403;
				return {
					status: false,
					message: "Unauthorized",
				};
			}

			const { valid } = await verifyPermission(
				UserPermission.DELETE_USER,
				validToken.id,
			);

			if (!valid) {
				set.status = 403;
				return {
					status: false,
					message: "Invalid Permission",
				};
			}

			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.id, params.id);
				},
			});

			if (!existingUser) {
				set.status = 404;
				return {
					status: false,
					message: "User not found",
				};
			}

			if (existingUser.deletedAt) {
				set.status = 400;
				return {
					status: false,
					message: "User already deleted",
				};
			}

			const { id } = existingUser;

			await verrou.createLock(`user:${id}`).run(async () => {
				try {
					// await 15s
					await new Promise((resolve) => setTimeout(resolve, 15000));

					await db
						.update(users)
						.set({
							deletedAt: new Date(),
						})
						.where(eq(users.id, id));
				} catch (error) {
					console.error(error);
					set.status = 500;
					return {
						status: false,
						message: "Failed to delete user",
						data: error,
					};
				}
			});

			set.status = 200;

			return {
				status: true,
				message: "User deleted successfully",
			};
		},
		{
			params: "deleteUserModel",
		},
	);
