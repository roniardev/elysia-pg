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
			headers,
			server,
			request,
		}) {
			console.log(headers);
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

			if (existingSession) {
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
			});

			const accessToken = await jwtAccess.sign({
				id: String(existingUser.id),
			});

			// GENERATE SESSION

			await db.insert(sessions).values({
				expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 31),
				id: generateId(21),
				userId: existingUser.id,
				ip: server?.requestIP(request)?.address || "",
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
