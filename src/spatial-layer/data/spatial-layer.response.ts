import { t } from "elysia"

export const readSpatialLayerResponse = t.Object({
	message: t.String(),
	data: t.Array(
		t.Object({
			id: t.String(),
			mapId: t.Union([t.String(), t.Null()]),
			name: t.String(),
			description: t.Union([t.String(), t.Null()]),
			layerType: t.String(),
			style: t.Any(),
			minZoom: t.Union([t.Number(), t.Null()]),
			maxZoom: t.Union([t.Number(), t.Null()]),
			opacity: t.Union([t.Number(), t.Null()]),
			isVisible: t.String(),
			zIndex: t.Union([t.Number(), t.Null()]),
			status: t.String(),
			visibility: t.String(),
			tags: t.Union([t.String(), t.Null()]),
			createdAt: t.String(),
			updatedAt: t.Union([t.String(), t.Null()]),
		}),
	),
})

export type IReadSpatialLayerResponse = typeof readSpatialLayerResponse.static
