import { Elysia, t } from "elysia";
import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth.setup";
import { db } from "@/db";
import { refreshToken, sessions } from "@/db/schema";
import bearer from "@elysiajs/bearer";
import { eq } from "drizzle-orm";

export const logout = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.use(bearer())
	.post("/logout", async function handler({ bearer, set, jwtAccess }) {
		const validToken = await jwtAccess.verify(bearer);

		if (!validToken) {
			set.status = 401;
			return {
				message: "Unauthorized",
			};
		}

		// CHECK EXISTING SESSION
		const existingSession = await db.query.sessions.findFirst({
			where: (table, { eq: eqFn }) => {
				return eqFn(table.userId, validToken.id as string);
			},
		});

		if (!existingSession) {
			set.status = 403;
			return {
				message: "Forbidden",
			};
		}

		await db.delete(sessions).where(eq(sessions.id, existingSession.id));
		await db
			.delete(refreshToken)
			.where(eq(refreshToken.sessionId, existingSession.id));

		set.status = 202;

		return {
			message: "Logged out successfully.",
		};
	});
