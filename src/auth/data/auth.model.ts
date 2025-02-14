import { Elysia, t } from "elysia";

export const basicAuthModel = new Elysia().model({
	basicAuthModel: t.Object({
		email: t.String(),
		password: t.String(),
	}),
});

export const registerModel = new Elysia().model({
	registerModel: t.Object({
		email: t.String(),
		password: t.String(),
		confirmPassword: t.String(),
	}),
});

export const verifyEmailModel = new Elysia().model({
	verifyEmailModel: t.Object({
		token: t.String(),
	}),
});
