import { t } from "elysia"

export const readSpatialDataResponse = t.Object({
	message: t.String(),
	data: t.Array(
		t.Object({
			id: t.String(),
			layerId: t.Union([t.String(), t.Null()]),
			name: t.String(),
			description: t.Union([t.String(), t.Null()]),
			latitude: t.Number(),
			longitude: t.Number(),
			properties: t.Any(),
			dataType: t.String(),
			status: t.String(),
			visibility: t.String(),
			tags: t.Union([t.String(), t.Null()]),
			createdAt: t.String(),
			updatedAt: t.Union([t.String(), t.Null()]),
		}),
	),
})

export type IReadSpatialDataResponse = typeof readSpatialDataResponse.static
