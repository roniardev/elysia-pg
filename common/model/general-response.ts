import { t } from "elysia";

export const generalResponse = t.Object({
	status: t.Boolean(),
	message: t.String(),
	data: t.Any(),
});

export type GeneralResponse = typeof generalResponse.static;
