import { Elysia, t } from "elysia"

export const createSpatialMapModel = new Elysia().model({
	createSpatialMapModel: t.Object({
		name: t.String(),
		description: t.Optional(t.String()),
		centerLat: t.Optional(t.Number()),
		centerLng: t.Optional(t.Number()),
		defaultZoom: t.Optional(t.Number()),
		baseMap: t.Optional(
			t.Union([
				t.Literal("osm"),
				t.Literal("satellite"),
				t.Literal("terrain"),
				t.Literal("dark"),
				t.Literal("light"),
			]),
		),
		projection: t.Optional(t.String()),
		settings: t.Optional(t.Any()),
		status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
		visibility: t.Optional(
			t.Union([t.Literal("public"), t.Literal("private"), t.Literal("organization")]),
		),
		tags: t.Optional(t.String()),
	}),
})

export const readAllSpatialMapModel = new Elysia().model({
	readAllSpatialMapModel: t.Object({
		page: t.Number(),
		limit: t.Number(),
		sort: t.Optional(t.String()),
		search: t.Optional(t.String()),
	}),
})

export const updateSpatialMapModel = new Elysia().model({
	updateSpatialMapModel: t.Object({
		name: t.Optional(t.String()),
		description: t.Optional(t.String()),
		centerLat: t.Optional(t.Number()),
		centerLng: t.Optional(t.Number()),
		defaultZoom: t.Optional(t.Number()),
		baseMap: t.Optional(
			t.Union([
				t.Literal("osm"),
				t.Literal("satellite"),
				t.Literal("terrain"),
				t.Literal("dark"),
				t.Literal("light"),
			]),
		),
		projection: t.Optional(t.String()),
		settings: t.Optional(t.Any()),
		status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
		visibility: t.Optional(
			t.Union([t.Literal("public"), t.Literal("private"), t.Literal("organization")]),
		),
		tags: t.Optional(t.String()),
	}),
})

export const deleteSpatialMapModel = new Elysia().model({
	deleteSpatialMapModel: t.Object({
		id: t.String(),
	}),
})

export const readSpatialMapModel = new Elysia().model({
	readSpatialMapModel: t.Object({
		id: t.String(),
	}),
})
