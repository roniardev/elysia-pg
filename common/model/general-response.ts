import { t } from "elysia";

export const generalResponse = t.Object({
	status: t.Boolean(),
	message: t.String(),
	data: t.Any(),
	total: t.Optional(t.Number()),
	totalPage: t.Optional(t.Number()),
	page: t.Optional(t.Number()),
	limit: t.Optional(t.Number()),
});

export type GeneralResponse = typeof generalResponse.static;
