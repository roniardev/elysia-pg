import { Elysia, t } from "elysia"

export const createSpatialDataModel = new Elysia().model({
	createSpatialDataModel: t.Object({
		layerId: t.Optional(t.String()),
		name: t.String(),
		description: t.Optional(t.String()),
		latitude: t.Number(),
		longitude: t.Number(),
		properties: t.Optional(t.Any()), // GeoJSON properties
		dataType: t.Optional(
			t.Union([
				t.Literal("point"),
				t.Literal("line"),
				t.Literal("polygon"),
				t.Literal("multipoint"),
				t.Literal("multiline"),
				t.Literal("multipolygon"),
			]),
		),
		status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
		visibility: t.Optional(
			t.Union([t.Literal("public"), t.Literal("private"), t.Literal("organization")]),
		),
		tags: t.Optional(t.String()),
	}),
})

export const readAllSpatialDataModel = new Elysia().model({
	readAllSpatialDataModel: t.Object({
		page: t.Number(),
		limit: t.Number(),
		sort: t.Optional(t.String()),
		search: t.Optional(t.String()),
		layerId: t.Optional(t.String()),
	}),
})

export const updateSpatialDataModel = new Elysia().model({
	updateSpatialDataModel: t.Object({
		layerId: t.Optional(t.String()),
		name: t.Optional(t.String()),
		description: t.Optional(t.String()),
		latitude: t.Optional(t.Number()),
		longitude: t.Optional(t.Number()),
		properties: t.Optional(t.Any()),
		dataType: t.Optional(
			t.Union([
				t.Literal("point"),
				t.Literal("line"),
				t.Literal("polygon"),
				t.Literal("multipoint"),
				t.Literal("multiline"),
				t.Literal("multipolygon"),
			]),
		),
		status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
		visibility: t.Optional(
			t.Union([t.Literal("public"), t.Literal("private"), t.Literal("organization")]),
		),
		tags: t.Optional(t.String()),
	}),
})

export const deleteSpatialDataModel = new Elysia().model({
	deleteSpatialDataModel: t.Object({
		id: t.String(),
	}),
})

export const readSpatialDataModel = new Elysia().model({
	readSpatialDataModel: t.Object({
		id: t.String(),
	}),
})
