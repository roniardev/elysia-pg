import { Elysia, t } from "elysia";

export const basicAuthModel = new Elysia().model({
	basicAuthModel: t.Object({
		email: t.String(),
		password: t.String(),
	}),
});
