import { t } from "elysia"

export const readSpatialMapResponse = t.Object({
	message: t.String(),
	data: t.Array(
		t.Object({
			id: t.String(),
			name: t.String(),
			description: t.Union([t.String(), t.Null()]),
			centerLat: t.Union([t.Number(), t.Null()]),
			centerLng: t.Union([t.Number(), t.Null()]),
			defaultZoom: t.Union([t.Number(), t.Null()]),
			baseMap: t.String(),
			projection: t.Union([t.String(), t.Null()]),
			settings: t.Any(),
			status: t.String(),
			visibility: t.String(),
			tags: t.Union([t.String(), t.Null()]),
			createdAt: t.String(),
			updatedAt: t.Union([t.String(), t.Null()]),
		}),
	),
})

export type IReadSpatialMapResponse = typeof readSpatialMapResponse.static
