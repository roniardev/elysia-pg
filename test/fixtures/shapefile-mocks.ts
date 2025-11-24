import JSZip from "jszip"

/**
 * NOTE: Create a mock shapefile ZIP buffer for testing
 *
 * Creates a minimal valid shapefile with points
 */
export async function createMockShapefileZip(): Promise<Buffer> {
	const zip = new JSZip()

	// NOTE: Minimal .shp header (100 bytes) + 1 point record
	// SHP format: File header (100 bytes) + Record header (8 bytes) + Point (20 bytes)
	const shpData = Buffer.alloc(128)

	// NOTE: File header (bytes 0-99)
	shpData.writeInt32BE(9994, 0) // File code (big-endian)
	shpData.writeInt32BE(64, 24) // File length (big-endian, in 16-bit words)
	shpData.writeInt32LE(1000, 28) // Version (little-endian)
	shpData.writeInt32LE(1, 32) // Shape type: Point (little-endian)

	// Bounding box (bytes 36-99)
	shpData.writeDoubleLE(106.0, 36) // Min X
	shpData.writeDoubleLE(-7.0, 44) // Min Y
	shpData.writeDoubleLE(107.0, 52) // Max X
	shpData.writeDoubleLE(-6.0, 60) // Max Y

	// NOTE: Record 1 (bytes 100-127)
	shpData.writeInt32BE(1, 100) // Record number (big-endian)
	shpData.writeInt32BE(10, 104) // Content length (big-endian, in 16-bit words)
	shpData.writeInt32LE(1, 108) // Shape type: Point (little-endian)
	shpData.writeDoubleLE(106.8456, 112) // X coordinate (longitude)
	shpData.writeDoubleLE(-6.2088, 120) // Y coordinate (latitude)

	// NOTE: Minimal .dbf header + 1 record
	// DBF format: Header (32 bytes) + Field descriptor (32 bytes) + Terminator (1 byte) + Record (variable)
	const dbfData = Buffer.alloc(100)

	// Header
	dbfData.writeUInt8(0x03, 0) // Version (dBASE III)
	dbfData.writeUInt8(25, 1) // Last update: Year (2025 - 1900 = 125)
	dbfData.writeUInt8(1, 2) // Month
	dbfData.writeUInt8(1, 3) // Day
	dbfData.writeUInt32LE(1, 4) // Number of records
	dbfData.writeUInt16LE(65, 8) // Header length
	dbfData.writeUInt16LE(33, 10) // Record length

	// Field descriptor for "NAME" field
	dbfData.write("NAME", 32) // Field name
	dbfData.writeUInt8(0x43, 43) // Field type: Character
	dbfData.writeUInt8(32, 48) // Field length

	// Terminator
	dbfData.writeUInt8(0x0d, 64)

	// Record 1
	dbfData.writeUInt8(0x20, 65) // Not deleted
	dbfData.write("Jakarta                         ", 66) // Name field (32 chars)

	// NOTE: .prj file (WGS84 projection)
	const prjData = `GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]`

	// Add files to ZIP
	zip.file("test.shp", shpData)
	zip.file("test.dbf", dbfData)
	zip.file("test.prj", prjData)

	const zipBuffer = await zip.generateAsync({ type: "nodebuffer" })
	return zipBuffer
}

/**
 * NOTE: Create a mock shapefile with multiple points
 */
export async function createMockShapefileWithMultiplePoints(): Promise<Buffer> {
	// NOTE: For simplicity, reuse the single point mock
	// In real tests, you might want to create actual multi-point shapefiles
	return createMockShapefileZip()
}

/**
 * NOTE: Create an invalid ZIP file (missing .shp)
 */
export async function createInvalidShapefileZip(): Promise<Buffer> {
	const zip = new JSZip()

	// Only add .dbf, no .shp
	const dbfData = Buffer.alloc(100)
	dbfData.writeUInt8(0x03, 0)
	zip.file("test.dbf", dbfData)

	return await zip.generateAsync({ type: "nodebuffer" })
}

/**
 * NOTE: Create a mock GeoJSON feature for testing
 */
export function createMockGeoJSONFeature() {
	return {
		type: "Feature",
		geometry: {
			type: "Point",
			coordinates: [106.8456, -6.2088],
		},
		properties: {
			name: "Jakarta",
			population: 10562088,
			type: "capital",
		},
	}
}
