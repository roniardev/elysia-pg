import { t } from "elysia";

export const readUserResponse = t.Object({
	message: t.String(),
	data: t.Array(
		t.Object({
			id: t.String(),
			email: t.String(),
			emailVerified: t.Boolean(),
			createdAt: t.String(),
			updatedAt: t.String(),
		}),
	),
});

export type IReadUserResponse = typeof readUserResponse.static;
