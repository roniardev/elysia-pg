import { Elysia, t } from "elysia";
import { basicAuthModel } from "../data/auth.model";
import { jwtAccessSetup, jwtRefreshSetup } from "../setup/auth.setup";
import { db } from "@/db";
import { refreshToken, sessions } from "@/db/schema";
import { generateId } from "lucia";

export const login = new Elysia()
	.use(basicAuthModel)
	.use(jwtAccessSetup)
	.use(jwtRefreshSetup)
	.post(
		"/login",
		async function handler({
			body,
			set,
			jwtAccess,
			jwtRefresh,
			server,
			request,
		}) {
			// CHECK EXISTING USER
			const existingUser = await db.query.users.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.email, body.email);
				},
			});

			if (!existingUser) {
				set.status = 403;
				return {
					message: "Invalid credentials.",
				};
			}

			// CHECK EXISTING SESSION
			const existingSession = await db.query.sessions.findFirst({
				where: (table, { eq: eqFn }) => {
					return eqFn(table.userId, existingUser.id);
				},
			});

			const isExpiredSession =
				(existingSession?.expiresAt || new Date(0)) < new Date();

			if (existingSession && !isExpiredSession) {
				set.status = 403;
				return {
					message: "Session already exists.",
				};
			}

			// CHECK VALID PASSWORD
			const validPassword = await Bun.password.verify(
				body.password,
				existingUser.hashedPassword || "",
			);
			if (!validPassword) {
				set.status = 403;
				return {
					message: "Invalid credentials.",
				};
			}

			// GENERATE SESSION
			const sessionId = generateId(21);
			await db.insert(sessions).values({
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 31),
				id: sessionId,
				userId: existingUser.id,
				ip: server?.requestIP(request)?.address || "",
			});

			// GENERATE REFRESH TOKEN & ACCESS TOKEN
			const refreshId = generateId(21);
			const refreshTokenGenerate = await jwtRefresh.sign({
				id: refreshId,
			});
			const hashedToken = new Bun.CryptoHasher("sha512")
				.update(refreshTokenGenerate)
				.digest("hex");

			await db.insert(refreshToken).values({
				hashedToken,
				id: refreshId,
				userId: existingUser.id,
				sessionId: sessionId,
			});

			const accessToken = await jwtAccess.sign({
				id: String(existingUser.id),
			});

			return {
				accessToken,
				refreshToken: refreshTokenGenerate,
			};
		},
		{
			body: t.Object({
				email: t.String(),
				password: t.String(),
			}),
		},
	);
