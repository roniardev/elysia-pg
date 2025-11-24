import { Elysia, t } from "elysia"

export const createSpatialLayerModel = new Elysia().model({
	createSpatialLayerModel: t.Object({
		mapId: t.Optional(t.String()),
		name: t.String(),
		description: t.Optional(t.String()),
		layerType: t.Optional(
			t.Union([t.Literal("vector"), t.Literal("raster"), t.Literal("tile")]),
		),
		style: t.Optional(t.Any()), // Layer styling options
		minZoom: t.Optional(t.Number()),
		maxZoom: t.Optional(t.Number()),
		opacity: t.Optional(t.Number()), // 0-100
		isVisible: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
		zIndex: t.Optional(t.Number()),
		status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
		visibility: t.Optional(
			t.Union([t.Literal("public"), t.Literal("private")]),
		),
		tags: t.Optional(t.String()),
	}),
})

export const readAllSpatialLayerModel = new Elysia().model({
	readAllSpatialLayerModel: t.Object({
		page: t.Number(),
		limit: t.Number(),
		sort: t.Optional(t.String()),
		search: t.Optional(t.String()),
		mapId: t.Optional(t.String()),
	}),
})

export const updateSpatialLayerModel = new Elysia().model({
	updateSpatialLayerModel: t.Object({
		mapId: t.Optional(t.String()),
		name: t.Optional(t.String()),
		description: t.Optional(t.String()),
		layerType: t.Optional(
			t.Union([t.Literal("vector"), t.Literal("raster"), t.Literal("tile")]),
		),
		style: t.Optional(t.Any()),
		minZoom: t.Optional(t.Number()),
		maxZoom: t.Optional(t.Number()),
		opacity: t.Optional(t.Number()),
		isVisible: t.Optional(t.Union([t.Literal("true"), t.Literal("false")])),
		zIndex: t.Optional(t.Number()),
		status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
		visibility: t.Optional(
			t.Union([t.Literal("public"), t.Literal("private")]),
		),
		tags: t.Optional(t.String()),
	}),
})

export const deleteSpatialLayerModel = new Elysia().model({
	deleteSpatialLayerModel: t.Object({
		id: t.String(),
	}),
})

export const readSpatialLayerModel = new Elysia().model({
	readSpatialLayerModel: t.Object({
		id: t.String(),
	}),
})
