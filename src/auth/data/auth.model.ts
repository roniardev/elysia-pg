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

export const forgotPasswordModel = new Elysia().model({
	forgotPasswordModel: t.Object({
		email: t.String(),
	}),
});

export const resetPasswordModel = new Elysia().model({
	resetPasswordModel: t.Object({
		token: t.String(),
		password: t.String(),
		confirmPassword: t.String(),
	}),
});

export const regenerateAccessTokenModel = new Elysia().model({
	regenerateAccessTokenModel: t.Object({
		accessToken: t.String(),
	}),
});
