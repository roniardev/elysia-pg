import { Elysia, t } from "elysia"

export const createOrganizationModel = new Elysia().model({
	createOrganizationModel: t.Object({
		name: t.String(),
		slug: t.String(),
	}),
})

export const readAllOrganizationModel = new Elysia().model({
	readAllOrganizationModel: t.Object({
		page: t.Number(),
		limit: t.Number(),
		sort: t.Optional(t.String()),
		search: t.Optional(t.String()),
	}),
})

export const updateOrganizationModel = new Elysia().model({
	updateOrganizationModel: t.Object({
		name: t.Optional(t.String()),
		slug: t.Optional(t.String()),
	}),
})

export const deleteOrganizationModel = new Elysia().model({
	deleteOrganizationModel: t.Object({
		id: t.String(),
	}),
})

export const readOrganizationModel = new Elysia().model({
	readOrganizationModel: t.Object({
		id: t.String(),
	}),
})

export const switchOrganizationModel = new Elysia().model({
	switchOrganizationModel: t.Object({
		organizationId: t.String(),
	}),
})
