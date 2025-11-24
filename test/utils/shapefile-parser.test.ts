import { describe, expect, it } from "bun:test"
import {
	extractCoordinates,
	getDataType,
	isValidCoordinates,
} from "@/utils/spatial/shapefile-parser"

describe("Shapefile Parser Utilities", () => {
	describe("extractCoordinates", () => {
		it("should extract coordinates from Point geometry", () => {
			const geometry = {
				type: "Point",
				coordinates: [106.8456, -6.2088],
			}

			const result = extractCoordinates(geometry)

			expect(result).toBeDefined()
			expect(result?.longitude).toBe(106.8456)
			expect(result?.latitude).toBe(-6.2088)
		})

		it("should extract first point from LineString geometry", () => {
			const geometry = {
				type: "LineString",
				coordinates: [
					[106.8456, -6.2088],
					[107.6191, -6.9175],
				],
			}

			const result = extractCoordinates(geometry)

			expect(result).toBeDefined()
			expect(result?.longitude).toBe(106.8456)
			expect(result?.latitude).toBe(-6.2088)
		})

		it("should extract first point from Polygon geometry", () => {
			const geometry = {
				type: "Polygon",
				coordinates: [
					[
						[106.8456, -6.2088],
						[107.6191, -6.9175],
						[110.4203, -6.9932],
						[106.8456, -6.2088],
					],
				],
			}

			const result = extractCoordinates(geometry)

			expect(result).toBeDefined()
			expect(result?.longitude).toBe(106.8456)
			expect(result?.latitude).toBe(-6.2088)
		})

		it("should extract first point from MultiPoint geometry", () => {
			const geometry = {
				type: "MultiPoint",
				coordinates: [
					[106.8456, -6.2088],
					[107.6191, -6.9175],
				],
			}

			const result = extractCoordinates(geometry)

			expect(result).toBeDefined()
			expect(result?.longitude).toBe(106.8456)
			expect(result?.latitude).toBe(-6.2088)
		})

		it("should extract first point from MultiLineString geometry", () => {
			const geometry = {
				type: "MultiLineString",
				coordinates: [
					[
						[106.8456, -6.2088],
						[107.6191, -6.9175],
					],
					[
						[110.4203, -6.9932],
						[112.7521, -7.2575],
					],
				],
			}

			const result = extractCoordinates(geometry)

			expect(result).toBeDefined()
			expect(result?.longitude).toBe(106.8456)
			expect(result?.latitude).toBe(-6.2088)
		})

		it("should extract first point from MultiPolygon geometry", () => {
			const geometry = {
				type: "MultiPolygon",
				coordinates: [
					[
						[
							[106.8456, -6.2088],
							[107.6191, -6.9175],
							[110.4203, -6.9932],
							[106.8456, -6.2088],
						],
					],
				],
			}

			const result = extractCoordinates(geometry)

			expect(result).toBeDefined()
			expect(result?.longitude).toBe(106.8456)
			expect(result?.latitude).toBe(-6.2088)
		})

		it("should return null for unsupported geometry type", () => {
			const geometry = {
				type: "GeometryCollection",
				coordinates: [],
			}

			const result = extractCoordinates(geometry)

			expect(result).toBeNull()
		})
	})

	describe("getDataType", () => {
		it("should convert Point to point", () => {
			expect(getDataType("Point")).toBe("point")
		})

		it("should convert LineString to line", () => {
			expect(getDataType("LineString")).toBe("line")
		})

		it("should convert Polygon to polygon", () => {
			expect(getDataType("Polygon")).toBe("polygon")
		})

		it("should convert MultiPoint to multipoint", () => {
			expect(getDataType("MultiPoint")).toBe("multipoint")
		})

		it("should convert MultiLineString to multiline", () => {
			expect(getDataType("MultiLineString")).toBe("multiline")
		})

		it("should convert MultiPolygon to multipolygon", () => {
			expect(getDataType("MultiPolygon")).toBe("multipolygon")
		})

		it("should return point as default for unknown type", () => {
			expect(getDataType("UnknownType")).toBe("point")
		})
	})

	describe("isValidCoordinates", () => {
		it("should validate correct coordinates", () => {
			expect(isValidCoordinates(106.8456, -6.2088)).toBe(true)
		})

		it("should validate coordinates at boundaries", () => {
			expect(isValidCoordinates(-180, -90)).toBe(true)
			expect(isValidCoordinates(180, 90)).toBe(true)
			expect(isValidCoordinates(0, 0)).toBe(true)
		})

		it("should reject longitude out of range (> 180)", () => {
			expect(isValidCoordinates(181, 0)).toBe(false)
		})

		it("should reject longitude out of range (< -180)", () => {
			expect(isValidCoordinates(-181, 0)).toBe(false)
		})

		it("should reject latitude out of range (> 90)", () => {
			expect(isValidCoordinates(0, 91)).toBe(false)
		})

		it("should reject latitude out of range (< -90)", () => {
			expect(isValidCoordinates(0, -91)).toBe(false)
		})

		it("should reject both coordinates out of range", () => {
			expect(isValidCoordinates(200, 100)).toBe(false)
		})

		it("should validate edge cases", () => {
			// NOTE: Test Indonesian coordinates
			expect(isValidCoordinates(95.0, -11.0)).toBe(true) // Western Indonesia
			expect(isValidCoordinates(141.0, 6.0)).toBe(true) // Eastern Indonesia
		})
	})
})
