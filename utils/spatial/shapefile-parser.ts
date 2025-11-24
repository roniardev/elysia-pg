import shapefile from "shapefile"
import JSZip from "jszip"

export interface ShapefileFeature {
	type: string
	geometry: {
		type: string
		coordinates: number[] | number[][] | number[][][]
	}
	properties: Record<string, any>
}

export interface ParsedShapefile {
	features: ShapefileFeature[]
	crs?: string
	totalFeatures: number
}

/**
 * NOTE: Parse Shapefile from Buffer
 *
 * Supports .zip containing .shp, .shx, .dbf files
 *
 * @param fileBuffer - Buffer of uploaded file (.zip or .shp)
 * @param fileName - Original filename
 * @returns Parsed shapefile data with features
 */
export async function parseShapefile(
	fileBuffer: Buffer,
	fileName: string,
): Promise<ParsedShapefile> {
	try {
		let shpBuffer: ArrayBuffer | null = null
		let dbfBuffer: ArrayBuffer | null = null
		let prjContent: string | null = null

		// NOTE: Check if it's a ZIP file
		if (fileName.endsWith(".zip")) {
			const zip = await JSZip.loadAsync(fileBuffer)
			const files = Object.keys(zip.files)

			// TODO: Find .shp, .dbf, and .prj files
			const shpFile = files.find((f) => f.endsWith(".shp"))
			const dbfFile = files.find((f) => f.endsWith(".dbf"))
			const prjFile = files.find((f) => f.endsWith(".prj"))

			if (!shpFile) {
				throw new Error("No .shp file found in ZIP archive")
			}

			// CHORE: Extract buffers
			shpBuffer = await zip.files[shpFile].async("arraybuffer")

			if (dbfFile) {
				dbfBuffer = await zip.files[dbfFile].async("arraybuffer")
			}

			if (prjFile) {
				prjContent = await zip.files[prjFile].async("string")
			}
		} else if (fileName.endsWith(".shp")) {
			// NOTE: Single .shp file (without .dbf attributes)
			shpBuffer = fileBuffer.buffer.slice(
				fileBuffer.byteOffset,
				fileBuffer.byteOffset + fileBuffer.byteLength,
			)
		} else {
			throw new Error(
				"Unsupported file format. Please upload .shp or .zip file",
			)
		}

		if (!shpBuffer) {
			throw new Error("Failed to extract shapefile data")
		}

		// CHORE: Parse shapefile using shapefile library
		const features: ShapefileFeature[] = []

		const source = dbfBuffer
			? await shapefile.open(shpBuffer, dbfBuffer)
			: await shapefile.open(shpBuffer)

		let result = await source.read()
		while (!result.done) {
			if (result.value) {
				features.push(result.value as ShapefileFeature)
			}
			result = await source.read()
		}

		return {
			features,
			crs: prjContent || undefined,
			totalFeatures: features.length,
		}
	} catch (error) {
		console.error("Error parsing shapefile:", error)
		throw new Error(
			`Failed to parse shapefile: ${error instanceof Error ? error.message : "Unknown error"}`,
		)
	}
}

/**
 * NOTE: Extract coordinates from GeoJSON geometry
 *
 * Returns [longitude, latitude] for Point geometry
 */
export function extractCoordinates(geometry: {
	type: string
	coordinates: any
}): { longitude: number; latitude: number } | null {
	if (geometry.type === "Point") {
		const [longitude, latitude] = geometry.coordinates
		return { longitude, latitude }
	}

	// NOTE: For other geometry types, get centroid or first point
	if (geometry.type === "LineString" || geometry.type === "MultiPoint") {
		const [longitude, latitude] = geometry.coordinates[0]
		return { longitude, latitude }
	}

	if (geometry.type === "Polygon" || geometry.type === "MultiLineString") {
		const [longitude, latitude] = geometry.coordinates[0][0]
		return { longitude, latitude }
	}

	if (geometry.type === "MultiPolygon") {
		const [longitude, latitude] = geometry.coordinates[0][0][0]
		return { longitude, latitude }
	}

	return null
}

/**
 * NOTE: Convert GeoJSON geometry type to spatial data type
 */
export function getDataType(geometryType: string): string {
	const typeMap: Record<string, string> = {
		Point: "point",
		LineString: "line",
		Polygon: "polygon",
		MultiPoint: "multipoint",
		MultiLineString: "multiline",
		MultiPolygon: "multipolygon",
	}

	return typeMap[geometryType] || "point"
}

/**
 * NOTE: Validate if coordinates are valid
 */
export function isValidCoordinates(
	longitude: number,
	latitude: number,
): boolean {
	return (
		longitude >= -180 &&
		longitude <= 180 &&
		latitude >= -90 &&
		latitude <= 90
	)
}
