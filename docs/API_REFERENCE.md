# API Reference

**Inventory Intelligence Platform — REST API Documentation**

**Base URL:** `http://localhost:8000` (development) or `https://your-space.hf.space` (production)  
**API Docs (Swagger):** `http://localhost:8000/docs`  
**API Docs (ReDoc):** `http://localhost:8000/redoc`

---

## Table of Contents

1. [Upload & Processing](#1-upload--processing)
   - [POST /api/upload](#11-post-apiupload)
   - [POST /api/process-sheet](#12-post-apiprocess-sheet)
2. [Analytics & Forecasting](#2-analytics--forecasting)
   - [GET /api/monthly-demand](#21-get-apimonthly-demand)
   - [GET /api/monthly-demand/{part_no}](#22-get-apimonthly-demandpart_no)
   - [GET /api/forecast-demand](#23-get-apiforecast-demand)
   - [GET /api/inventory](#24-get-apiinventory)
   - [GET /api/inventory/filters](#25-get-apiinventoryfilters)
   - [GET /api/inventory-risk](#26-get-apiinventory-risk)
   - [GET /api/parts](#27-get-apiparts)
3. [Export](#3-export)
   - [POST /api/export-forecast](#31-post-apiexport-forecast)
4. [Error Codes](#4-error-codes)

---

## 1. Upload & Processing

### 1.1 POST /api/upload

Upload a CSV or Excel file for processing. The file is streamed to disk and sheet names are extracted.

#### Request

**Method:** `POST`  
**Content-Type:** `multipart/form-data`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file` | File | Yes | CSV (.csv) or Excel (.xlsx) file |

#### Response (200 OK)

```json
{
  "file_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sheets": ["Sheet1", "Sheet2", "Data"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `file_id` | UUID | Unique identifier for the uploaded file |
| `sheets` | String[] | List of sheet names (["Default"] for CSV) |

#### Response (500 Internal Server Error)

```json
{
  "detail": "Error uploading file: [error description]"
}
```

#### Example

```bash
curl -X POST http://localhost:8000/api/upload \
  -F "file=@inventory_data.xlsx"
```

#### Validation Rules

| Rule | Error |
|------|-------|
| File must be .csv or .xlsx | Naming convention enforced via UUID extension |
| File must not be empty | Error caught at read stage |

---

### 1.2 POST /api/process-sheet

Process a specific sheet from an uploaded file. Transforms wide-format data into normalized long format, validates structure, and persists the transformed dataset.

#### Request

**Method:** `POST`  
**Content-Type:** `application/json`

```json
{
  "file_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "sheet_name": "Sheet1"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `file_id` | String | Yes | UUID returned from upload |
| `sheet_name` | String | Yes | Sheet name to process |

#### Response (200 OK)

```json
{
  "total_rows": 15000,
  "columns": ["Part No", "Month", "Demand", "Category"],
  "total_parts": 450,
  "total_demand": 1250000.0,
  "sample_data": [
    {
      "Part No": "SKU-001",
      "Month": "Jan-2024",
      "Demand": 1200,
      "Category": "Electronics"
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `total_rows` | Integer | Total rows in transformed dataset |
| `columns` | String[] | Column names in transformed dataset |
| `total_parts` | Integer | Unique part numbers |
| `total_demand` | Float | Sum of all demand values |
| `sample_data` | Object[] | First 20 rows of transformed data |

#### Response (400 Bad Request)

```json
{
  "detail": "Invalid sheet: 'Summary' is missing the required 'Part No' column."
}
```

```json
{
  "detail": "Data transformation failed. Ensure the sheet has a valid time-series format (e.g., monthly columns). Error: ..."
}
```

#### Response (404 Not Found)

```json
{
  "detail": "File not found. It may have expired or been deleted."
}
```

#### Validation Rules

| Rule | Error |
|------|-------|
| Dataset must not be empty | 400: "Empty or invalid sheet" |
| `Part No` column must exist | 400: "Missing required 'Part No' column" |
| Data must be transformable | 400: "Data transformation failed" |
| File ID must exist on disk | 404: "File not found" |

#### Example

```bash
curl -X POST http://localhost:8000/api/process-sheet \
  -H "Content-Type: application/json" \
  -d '{"file_id": "a1b2c3d4...", "sheet_name": "Sheet1"}'
```

---

## 2. Analytics & Forecasting

### 2.1 GET /api/monthly-demand

Get aggregated monthly demand and forecast for all parts (global).

#### Request

**Method:** `GET`  
**Query Parameters:** None

#### Response (200 OK)

```json
{
  "items": [
    {
      "Month": "Jan-2024",
      "Demand": 125000,
      "Forecast": 120000,
      "Is_Future": false
    },
    {
      "Month": "Feb-2024",
      "Demand": 132000,
      "Forecast": 128000,
      "Is_Future": false
    },
    {
      "Month": "Jan-2025",
      "Demand": null,
      "Forecast": 115000,
      "Is_Future": true
    }
  ],
  "source": "GLOBAL_AGGREGATED",
  "sku_state": "GLOBAL",
  "confidence": "HIGH",
  "sparsity": 0.08,
  "confidence_score": 95
}
```

| Field | Type | Description |
|-------|------|-------------|
| `items` | Object[] | Array of monthly demand + forecast records |
| `items[].Month` | String | Month in "MMM-YYYY" format |
| `items[].Demand` | Float or null | Historical demand (null for future months) |
| `items[].Forecast` | Float | Forecasted demand (rounded to integer) |
| `items[].Is_Future` | Boolean | True if month is in the future |
| `source` | String | Forecast source identifier |
| `sku_state` | String | SKU state (GLOBAL for all parts) |
| `confidence` | String | Confidence level description |
| `sparsity` | Float | Sparsity ratio (0-1) |
| `confidence_score` | Integer | Numeric confidence score (0-99) |

#### Error Response

```json
{
  "items": [],
  "source": "NONE",
  "sku_state": "NONE",
  "confidence": "NONE",
  "sparsity": 0
}
```

---

### 2.2 GET /api/monthly-demand/{part_no}

Get monthly demand and forecast for a specific part number.

#### Request

**Method:** `GET`  
**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `part_no` | String | Yes | Part number (use "ALL_PARTS" for global) |

#### Response (200 OK)

Same structure as global endpoint, but with per-SKU metadata:

```json
{
  "items": [
    {
      "Month": "Jan-2024",
      "Demand": 450,
      "Forecast": 430,
      "Is_Future": false
    }
  ],
  "source": "PART_LEVEL",
  "sku_state": "ACTIVE",
  "confidence": "HIGH",
  "sparsity": 0.12,
  "confidence_score": 87
}
```

#### Forecast Source Values

| Source | Description |
|--------|-------------|
| `PART_LEVEL` | Forecast based on SKU's own demand history |
| `HALB_FALLBACK` | Fallback to category-level aggregation |
| `GLOBAL_FALLBACK` | Fallback to global aggregation |
| `LOW_CONFIDENCE` | Insufficient data for reliable forecast |
| `NO_FORECAST` | SKU is inactive (zero demand) |

#### SKU State Values

| State | Description |
|-------|-------------|
| `ACTIVE` | Sufficient demand history for reliable forecast |
| `SPARSE` | Intermittent demand with significant zero periods |
| `DORMANT` | Very low activity (≤2 non-zero months) |
| `INACTIVE` | Zero demand across all periods |
| `GLOBAL` | Aggregated view (not SKU-specific) |

#### Confidence Levels

| Level | Score Range | Meaning |
|-------|-------------|---------|
| HIGH | 75-99 | Reliable forecast based on sufficient data |
| MEDIUM | 45-74 | Moderate confidence, some data limitations |
| LOW | 15-44 | Low confidence, sparse or volatile data |
| NONE | 0 | No forecast possible |

---

### 2.3 GET /api/forecast-demand

Legacy endpoint for simple aggregated forecast.

#### Request

**Method:** `GET`

#### Response (200 OK)

```json
[
  {
    "Month": "Jan-2024",
    "Demand": 125000,
    "Forecast": 120000.0
  },
  {
    "Month": "Feb-2024",
    "Demand": 132000,
    "Forecast": 128000.0
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `Month` | String | Month in "MMM-YYYY" format |
| `Demand` | Float | Historical demand |
| `Forecast` | Float | 3-month rolling average forecast |

---

### 2.4 GET /api/inventory

Get paginated inventory data with search and filter capabilities.

#### Request

**Method:** `GET`  
**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Integer | No | 1 | Page number (1-based) |
| `limit` | Integer | No | 20 | Items per page |
| `search` | String | No | "" | Case-insensitive search across all columns |
| `month` | String | No | "" | Filter by month (e.g., "Jan") |
| `year` | String | No | "" | Filter by year (e.g., "2024") |

#### Response (200 OK)

```json
{
  "items": [
    {
      "Part No": "SKU-001",
      "Month": "Jan-2024",
      "Demand": 1200,
      "Category": "Electronics"
    }
  ],
  "total": 15000,
  "columns": ["Part No", "Month", "Demand", "Category"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `items` | Object[] | Paginated inventory records |
| `total` | Integer | Total matching records (for pagination) |
| `columns` | String[] | Available column names |

#### Example

```bash
curl "http://localhost:8000/api/inventory?page=1&limit=50&search=SKU&month=Jan&year=2024"
```

---

### 2.5 GET /api/inventory/filters

Get available month and year filter options.

#### Request

**Method:** `GET`

#### Response (200 OK)

```json
{
  "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  "years": ["2025", "2024"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `months` | String[] | Available months sorted chronologically |
| `years` | String[] | Available years sorted descending |

---

### 2.6 GET /api/inventory-risk

Get comprehensive inventory risk assessment for all SKUs.

#### Request

**Method:** `GET`

#### Response (200 OK)

```json
[
  {
    "Part No": "SKU-045",
    "Risk": "HIGH",
    "Volatility": 1.85,
    "Sparsity": 0.42,
    "ForecastGrowth": 1.62,
    "RiskScore": 0.84,
    "Recommendation": "Increase Safety Stock",
    "Reasons": ["HIGH VOLATILITY", "FORECAST SURGE"],
    "State": "Surging",
    "DemandTrend": "UP",
    "Confidence": "MEDIUM",
    "ForecastStatus": "PART_LEVEL"
  }
]
```

| Field | Type | Description |
|-------|------|-------------|
| `Part No` | String | SKU or part number |
| `Risk` | String | Risk classification (HIGH/MEDIUM/LOW) |
| `Volatility` | Float | Coefficient of variation (std/mean) |
| `Sparsity` | Float | Ratio of zero-demand periods |
| `ForecastGrowth` | Float | Ratio of recent demand to historical mean |
| `RiskScore` | Float | Composite risk score (0-1+) |
| `Recommendation` | String | Operational recommendation |
| `Reasons` | String[] | Root cause tags |
| `State` | String | SKU behavior state |
| `DemandTrend` | String | Demand direction (UP/DOWN/STABLE) |
| `Confidence` | String | Forecast confidence level |
| `ForecastStatus` | String | Forecast methodology used |

#### State Descriptions

| State | Description |
|-------|-------------|
| `Stable` | Low volatility, consistent demand |
| `Volatile` | High demand variability |
| `Sparse` | Intermittent demand pattern |
| `Dormant` | Very low activity |
| `Surging` | Rapid demand growth |

#### Risk Scoring Formula

```
risk_score = (volatility_capped × 0.4) + (sparsity × 0.3) + (forecast_growth_capped × 0.3)

Where:
  volatility_capped = min(volatility, 2.0)
  forecast_growth_capped = min(forecast_growth, 2.0)

Classification:
  >= 0.7 → HIGH
  >= 0.4 → MEDIUM
  < 0.4  → LOW
```

---

### 2.7 GET /api/parts

Get a sorted list of all unique part numbers in the dataset.

#### Request

**Method:** `GET`

#### Response (200 OK)

```json
["SKU-001", "SKU-002", "SKU-003", "PART-A100", "PART-B200"]
```

#### Error Response

```json
[]
```

---

## 3. Export

### 3.1 POST /api/export-forecast

Generate and download forecast data in CSV or Excel format.

#### Request

**Method:** `POST`  
**Content-Type:** `application/json`

```json
{
  "parts": ["SKU-001", "SKU-002", "SKU-003"],
  "horizon": 6,
  "format": "csv"
}
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `parts` | String[] | Yes | List of part numbers (use `["ALL_PARTS"]` for all) |
| `horizon` | Integer | Yes | Number of future months to include (1-12) |
| `format` | String | Yes | Export format: `"csv"` or `"xlsx"` |

#### Response (200 OK)

**Content-Type:** `text/csv` or `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`

**CSV Example:**
```csv
Part Number,Part Name,Forecast Month,Forecast Value,Confidence Lower,Confidence Upper,Risk Level,Demand Trend,Forecast Generated Date
"SKU-001","Widget A","May-2025",450,382,517,"MEDIUM","UP","2026-07-01 09:00:00"
"SKU-001","Widget A","Jun-2025",460,391,529,"MEDIUM","UP","2026-07-01 09:00:00"
```

#### Response (400 Bad Request)

```json
{
  "detail": "Invalid export format specified."
}
```

#### Response (404 Not Found)

```json
{
  "detail": "No data available to export."
}
```

#### Export Schema

| Column | Type | Description |
|--------|------|-------------|
| `Part Number` | String | Part/SKU identifier |
| `Part Name` | String | Part description (N/A if unavailable) |
| `Forecast Month` | String | Month in MMM-YYYY format |
| `Forecast Value` | Float | Predicted demand |
| `Confidence Lower` | Float | Lower bound (Forecast × 0.85) |
| `Confidence Upper` | Float | Upper bound (Forecast × 1.15) |
| `Risk Level` | String | Risk classification |
| `Demand Trend` | String | Trend direction |
| `Forecast Generated Date` | String | Export timestamp |

#### Limitations

- Maximum 50,000 rows exported
- "ALL_PARTS" will process every SKU in the dataset
- XLSX format uses a temporary file before streaming

#### Example

```bash
# CSV Export
curl -X POST http://localhost:8000/api/export-forecast \
  -H "Content-Type: application/json" \
  -d '{"parts": ["ALL_PARTS"], "horizon": 12, "format": "csv"}' \
  --output forecast_export.csv

# Excel Export
curl -X POST http://localhost:8000/api/export-forecast \
  -H "Content-Type: application/json" \
  -d '{"parts": ["SKU-001", "SKU-002"], "horizon": 6, "format": "xlsx"}' \
  --output forecast_export.xlsx
```

---

## 4. Error Codes

### HTTP Status Codes

| Code | Description | Typical Cause |
|------|-------------|---------------|
| `200` | Success | Request completed successfully |
| `400` | Bad Request | Invalid input, missing required fields, empty data |
| `404` | Not Found | File not found, no data available |
| `500` | Internal Server Error | Unexpected processing failure |

### Common Error Responses

```json
{
  "detail": "Error message describing the issue"
}
```

### Error Message Reference

| Endpoint | Error Message | Cause |
|----------|---------------|-------|
| `/api/upload` | "Error uploading file: ..." | File stream or write failure |
| `/api/process-sheet` | "File not found. It may have expired or been deleted." | Invalid or expired file_id |
| `/api/process-sheet` | "Invalid sheet: ... is missing the required 'Part No' column." | Sheet lacks Part No column |
| `/api/process-sheet` | "Data transformation failed. ..." | Unsupported data format |
| `/api/export-forecast` | "Invalid export format specified." | Format not 'csv' or 'xlsx' |
| `/api/export-forecast` | "No data available to export." | No processed data found |
| All analytics | "Error reading parts: ..." | Malformed or missing Part No column |

---

*End of API Reference*