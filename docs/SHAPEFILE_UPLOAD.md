# 📂 Shapefile Upload Feature

Fitur untuk mengupload file Shapefile (.shp) dan mengkonversinya menjadi data spatial di PostGIS.

## 🎯 Overview

Shapefile adalah format file GIS (Geographic Information System) yang umum digunakan untuk menyimpan data geospasial vector. Fitur ini memungkinkan user untuk:
- Upload file Shapefile dalam format .zip
- Otomatis parsing dan extract data geometri
- Konversi ke format PostGIS Point
- Bulk insert ke database

## 📦 Format File yang Didukung

### Shapefile ZIP Archive
File .zip harus berisi minimal:
- **`.shp`** - File utama berisi data geometri (REQUIRED)
- **`.dbf`** - File berisi data atribut/properties (OPTIONAL)
- **`.shx`** - Shape index file (OPTIONAL)
- **`.prj`** - File projection/coordinate system (OPTIONAL)

### Contoh Struktur ZIP:
```
my-shapefile.zip
├── locations.shp    ← Geometri
├── locations.dbf    ← Atribut/properties
├── locations.shx    ← Index
└── locations.prj    ← Projection (CRS)
```

## 🚀 API Endpoint

**POST** `/spatial-data/upload-shapefile`

### Headers
```
Authorization: Bearer <your-jwt-token>
Content-Type: multipart/form-data
```

### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ | Shapefile .zip (max 50MB) |
| `layerId` | String | ❌ | ID layer untuk grouping |
| `defaultStatus` | String | ❌ | Default status: "active" atau "inactive" |
| `defaultVisibility` | String | ❌ | Default visibility: "public", "private", atau "organization" |
| `tags` | String | ❌ | Tags comma-separated |

### Response Success (201 Created)

```json
{
  "status": true,
  "message": "Shapefile uploaded and processed successfully",
  "data": {
    "totalFeatures": 150,
    "successCount": 145,
    "skipCount": 5,
    "insertedRecords": 145,
    "fileName": "indonesia-cities.zip",
    "crs": "GEOGCS[\"WGS 84\",...]"
  }
}
```

### Response Fields

- **`totalFeatures`**: Total fitur yang ditemukan di shapefile
- **`successCount`**: Jumlah fitur yang berhasil diproses
- **`skipCount`**: Jumlah fitur yang di-skip (invalid coordinates, dll)
- **`insertedRecords`**: Jumlah record yang di-insert ke database
- **`fileName`**: Nama file yang di-upload
- **`crs`**: Coordinate Reference System (jika ada .prj file)

## 📝 Contoh Penggunaan

### Menggunakan cURL

```bash
curl -X POST http://localhost:3000/spatial-data/upload-shapefile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -F "file=@/path/to/shapefile.zip" \
  -F "layerId=01HXE8K9QWERTY123456" \
  -F "defaultStatus=active" \
  -F "defaultVisibility=public" \
  -F "tags=imported,cities,indonesia"
```

### Menggunakan JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('layerId', '01HXE8K9QWERTY123456');
formData.append('defaultStatus', 'active');
formData.append('defaultVisibility', 'public');
formData.append('tags', 'imported,cities');

const response = await fetch('http://localhost:3000/spatial-data/upload-shapefile', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});

const result = await response.json();
console.log('Uploaded:', result);
```

### Menggunakan Postman

1. Method: **POST**
2. URL: `http://localhost:3000/spatial-data/upload-shapefile`
3. Headers:
   - `Authorization`: `Bearer <token>`
4. Body → form-data:
   - Key: `file`, Type: File, Value: [Select .zip file]
   - Key: `layerId`, Type: Text, Value: `01HXE8K9...`
   - Key: `defaultStatus`, Type: Text, Value: `active`
   - Key: `defaultVisibility`, Type: Text, Value: `public`
   - Key: `tags`, Type: Text, Value: `cities,imported`

## 🔄 Proses Konversi

### 1. **Parse Shapefile**
```typescript
const parsedData = await parseShapefile(fileBuffer, fileName)
// Returns: { features, crs, totalFeatures }
```

### 2. **Extract Coordinates**
Mengambil koordinat dari berbagai tipe geometri:

| Geometry Type | Cara Extract |
|---------------|--------------|
| Point | Langsung ambil coordinates |
| LineString | Ambil koordinat pertama |
| Polygon | Ambil koordinat pertama dari ring pertama |
| MultiPoint | Ambil point pertama |
| MultiLineString | Ambil koordinat pertama dari line pertama |
| MultiPolygon | Ambil koordinat pertama dari polygon pertama |

### 3. **Validasi Koordinat**
```typescript
// Longitude: -180 to 180
// Latitude: -90 to 90
isValidCoordinates(longitude, latitude)
```

### 4. **Generate Name**
Prioritas nama dari properties shapefile:
1. `properties.name`
2. `properties.NAME`
3. `properties.title`
4. `properties.TITLE`
5. `"Feature {index}"` (fallback)

### 5. **Convert to PostGIS**
```sql
ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
```

### 6. **Bulk Insert**
Semua record di-insert sekaligus dalam satu transaction untuk performance.

## 📊 Contoh Data Shapefile

### Properties yang Akan Disimpan
Semua properties dari .dbf file akan disimpan di kolom `properties` (JSONB):

```json
{
  "name": "Jakarta",
  "population": 10562088,
  "area_km2": 664.01,
  "province": "DKI Jakarta",
  "type": "capital",
  "founded": 1527
}
```

### Data Type Mapping

| Shapefile Geometry | Spatial Data Type |
|-------------------|------------------|
| Point | `point` |
| LineString | `line` |
| Polygon | `polygon` |
| MultiPoint | `multipoint` |
| MultiLineString | `multiline` |
| MultiPolygon | `multipolygon` |

## ⚠️ Error Handling

### Common Errors

**1. File Format Error**
```json
{
  "status": false,
  "message": "Unsupported file format. Please upload .shp or .zip file"
}
```

**2. No .shp File in ZIP**
```json
{
  "status": false,
  "message": "No .shp file found in ZIP archive"
}
```

**3. File Too Large**
```json
{
  "status": false,
  "message": "File size exceeds maximum limit of 50MB"
}
```

**4. Invalid Coordinates**
Features dengan koordinat invalid akan di-skip dan dicatat di `skipCount`.

## 🎨 Use Cases

### 1. Import Data Peta Kota
```bash
# Upload shapefile berisi data kota-kota
curl -X POST http://localhost:3000/spatial-data/upload-shapefile \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cities.zip" \
  -F "tags=cities,urban" \
  -F "defaultVisibility=public"
```

### 2. Import Batas Administrasi
```bash
# Upload shapefile batas provinsi/kabupaten
curl -X POST http://localhost:3000/spatial-data/upload-shapefile \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@admin-boundaries.zip" \
  -F "layerId=$LAYER_ID" \
  -F "tags=boundaries,administrative"
```

### 3. Import Jaringan Jalan
```bash
# Upload shapefile jaringan jalan (LineString)
curl -X POST http://localhost:3000/spatial-data/upload-shapefile \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@roads.zip" \
  -F "tags=roads,infrastructure"
```

### 4. Import Data Internal Organisasi
```bash
# Upload shapefile dengan visibility organization (hanya visible untuk anggota organisasi)
curl -X POST http://localhost:3000/spatial-data/upload-shapefile \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@internal-locations.zip" \
  -F "defaultVisibility=organization" \
  -F "tags=internal,confidential"
```

## 🔐 Visibility Options

Spatial data memiliki 3 level visibility:

| Visibility | Deskripsi | Use Case |
|-----------|-----------|----------|
| **public** | Visible untuk semua user | Data publik seperti tempat wisata, landmark |
| **private** | Hanya visible untuk user yang membuat | Data personal, lokasi pribadi |
| **organization** | Visible untuk semua member di organisasi yang sama | Data internal perusahaan, lokasi cabang |

### Contoh:
```typescript
// Public - semua orang bisa lihat
defaultVisibility: "public"

// Private - hanya saya yang bisa lihat
defaultVisibility: "private"

// Organization - semua anggota organisasi saya bisa lihat
defaultVisibility: "organization"
```

## 🔧 Konfigurasi

### Max File Size
Default: **50MB**

Untuk mengubah limit, edit di `upload-shapefile.ts`:
```typescript
maxSize: 50 * 1024 * 1024, // 50MB
```

### Supported MIME Types
- `application/zip`
- `application/x-zip-compressed`

## 📈 Performance

### Bulk Insert
Semua data di-insert sekaligus untuk performa optimal:

| Jumlah Features | Waktu Estimasi |
|----------------|----------------|
| 100 features | ~1-2 detik |
| 1,000 features | ~5-10 detik |
| 10,000 features | ~30-60 detik |

### Memory Usage
File di-parse di memory, pastikan server punya RAM cukup untuk file besar.

## 🛡️ Security

1. ✅ **JWT Authentication** - User harus login
2. ✅ **Permission Check** - Harus punya `create:spatial-data`
3. ✅ **Multi-tenant** - Data isolated per organization
4. ✅ **File Size Limit** - Max 50MB
5. ✅ **File Type Validation** - Hanya .zip
6. ✅ **Coordinate Validation** - Validasi range lat/lng

## 📚 Dependencies

```json
{
  "shapefile": "^0.6.6",
  "jszip": "^3.10.1"
}
```

## 🔍 Troubleshooting

### Problem: "Failed to parse shapefile"
**Solution**: Pastikan .zip berisi file .shp yang valid

### Problem: "All features skipped"
**Solution**: Cek koordinat di shapefile, mungkin menggunakan projection yang salah

### Problem: "File too large"
**Solution**:
- Split shapefile ke beberapa file lebih kecil
- Atau naikkan limit di konfigurasi

### Problem: "No geometry found"
**Solution**: Pastikan shapefile berisi geometri Point, LineString, atau Polygon

## 🎯 Next Steps

Setelah upload shapefile, data bisa:
1. Ditampilkan di map dengan GET `/spatial-data`
2. Di-filter berdasarkan layer dengan `?layerId=xxx`
3. Di-query spatial (find nearest, within radius, dll)
4. Di-export kembali ke format lain

---

**Happy Mapping! 🗺️**
