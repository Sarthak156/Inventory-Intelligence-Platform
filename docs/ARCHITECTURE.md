# Architecture Guide

**Inventory Intelligence Platform — System Architecture**

**Version:** 1.0.0  
**Last Updated:** July 2026  
**Status:** Production

---

## Table of Contents

1. [Frontend Architecture](#1-frontend-architecture)
2. [Backend Architecture](#2-backend-architecture)
3. [API Communication Flow](#3-api-communication-flow)
4. [Upload Pipeline](#4-upload-pipeline)
5. [Forecasting Workflow](#5-forecasting-workflow)
6. [Recommendation Engine Pipeline](#6-recommendation-engine-pipeline)
7. [Export System](#7-export-system)
8. [Deployment Architecture](#8-deployment-architecture)
9. [HuggingFace / Vercel Integration](#9-huggingface--vercel-integration)
10. [Data Lifecycle](#10-data-lifecycle)

---

## 1. Frontend Architecture

### 1.1 Overview

The frontend is a single-page application (SPA) built with React 19, utilizing Vite 8 as the build tool and TailwindCSS 4 for styling. The architecture follows a feature-based component organization with centralized state management through React Context.

### 1.2 Layer Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Routing Layer                         │
│              React Router v7 (BrowserRouter)             │
│  / → Dashboard | /forecast | /inventory | /risks | ...  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                    Page Layer                             │
│  Dashboard.jsx  Forecast.jsx  Inventory.jsx  Risks.jsx   │
│  Recommendations.jsx  Upload.jsx  Settings.jsx           │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│                Component Layer                            │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────┐  │
│  │  AI Components │  │ Recommendation   │  │ Sidebar   │  │
│  │  AIInsightPanel│  │ Components       │  │ Sidebar   │  │
│  │  AIStatus      │  │ RecoTable        │  │           │  │
│  │  ExecBriefing  │  │ RecoFilters      │  │           │  │
│  └──────────────┘  └──────────────────┘  └───────────┘  │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Context Layer                               │
│  ┌─────────────────┐  ┌─────────────────────────────┐    │
│  │   DataContext    │  │      ReactContexts          │    │
│  │ (Shared State)   │  │  (UI/Theme/Settings)       │    │
│  └─────────────────┘  └─────────────────────────────┘    │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Service Layer                               │
│  ┌─────────┐  ┌───────────┐  ┌──────────────┐           │
│  │ api.js  │  │aiInsights │  │geminiService │           │
│  │ (Axios) │  │   .js     │  │    .js       │           │
│  └─────────┘  └───────────┘  └──────────────┘           │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│               Utility Layer                               │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │aiInsight   │  │fallback      │  │recommendation    │  │
│  │Cache.js    │  │Insights.js   │  │Engine.js         │  │
│  └────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Component Tree

```
<App>
  ├── <DataContext.Provider>
  │   └── <BrowserRouter>
  │       └── <MainLayout>
  │           ├── <Sidebar>
  │           └── <Routes>
  │               ├── / → <Dashboard>
  │               │   ├── <KPICard> (×8)
  │               │   ├── <CriticalAlert>
  │               │   ├── <MainForecastChart>
  │               │   ├── <AIInsightEngine>
  │               │   ├── <HighRiskTable>
  │               │   ├── <RiskDistributionChart>
  │               │   ├── <InventoryHealth>
  │               │   ├── <ForecastSummary>
  │               │   └── <RiskTrendChart>
  │               ├── /forecast → <Forecast>
  │               │   ├── <MultiSelectPartsDropdown>
  │               │   ├── <ExportButton>
  │               │   └── <ExportForecastModal>
  │               ├── /inventory → <Inventory>
  │               ├── /risks → <Risks>
  │               ├── /recommendations → <Recommendations>
  │               │   ├── <RecommendationFilters>
  │               │   ├── <RecommendationTable>
  │               │   └── <PaginationControls>
  │               ├── /upload → <Upload>
  │               └── /settings → <Settings>
```

### 1.4 State Management

| Context | State | Purpose |
|---------|-------|---------|
| `DataContext` | Uploaded data, transformed dataset, processing status | Global data state |
| `ReactContexts` | Theme, UI preferences, user settings | Application-level preferences |

### 1.5 Routing Configuration

| Route | Page Component | Auth Required | Description |
|-------|---------------|---------------|-------------|
| `/` | Dashboard | No | AI Operations Command Center |
| `/forecast` | Forecast | No | Demand forecasting and projection |
| `/inventory` | Inventory | No | Inventory data browser |
| `/risks` | Risks | No | Risk assessment dashboard |
| `/recommendations` | Recommendations | No | AI-driven recommendations |
| `/upload` | Upload | No | Data upload and processing |
| `/settings` | Settings | No | Application settings |

---

## 2. Backend Architecture

### 2.1 Overview

The backend is a modular FastAPI application following a service-oriented architecture. It is organized into API routers, service layers, utility modules, and validation modules.

### 2.2 Module Structure

```
backend/
├── main.py                          # Application entry point, CORS, router mounting
├── Dockerfile                       # Container configuration
├── requirements.txt                 # Python dependencies
├── .env                             # Environment variables
├── .gitignore
├── app/
│   ├── api/                         # API route handlers
│   │   ├── upload.py                # File upload & sheet processing endpoints
│   │   ├── analytics.py             # Analytics, forecast, inventory, export endpoints
│   │   └── forecast.py              # Legacy forecast endpoint
│   ├── services/                    # Business logic layer
│   │   └── risk_engine.py           # Inventory risk scoring engine
│   ├── utils/                       # Utility functions
│   │   └── data_transformer.py      # Data format transformation
│   └── validation/                  # Data validation
│       └── data_validator.py        # Input validation rules
├── data/
│   └── transformed_data.csv         # Processed dataset (persistent)
└── uploads/                         # Uploaded file storage
```

### 2.3 Dependency Injection Flow

```
FastAPI Application
│
├── CORS Middleware
│   └── allow_origins=["*"]
│
├── Router: upload.py
│   ├── POST /api/upload
│   │   └── → data_transformer.py (indirect via process-sheet)
│   └── POST /api/process-sheet
│       └── → data_transformer.py (transform_dataset)
│
├── Router: analytics.py
│   ├── GET /api/monthly-demand[/{part_no}]
│   │   └── → risk_engine.py (calculate_inventory_risk)
│   ├── GET /api/inventory
│   ├── GET /api/inventory/filters
│   ├── GET /api/inventory-risk
│   │   └── → risk_engine.py (calculate_inventory_risk)
│   ├── GET /api/parts
│   └── POST /api/export-forecast
│       └── → risk_engine.py (calculate_inventory_risk)
│
└── Router: forecast.py
    └── GET /api/forecast-demand
```

### 2.4 Caching Architecture

The analytics module implements a file-modification-time-based cache:

```python
_cached_df = None
_cached_mtime = 0

def get_cached_df():
    global _cached_df, _cached_mtime
    current_mtime = os.path.getmtime(DATA_FILE)
    if _cached_df is None or current_mtime > _cached_mtime:
        _cached_df = pd.read_csv(DATA_FILE, low_memory=False)
        _cached_mtime = current_mtime
    return _cached_df
```

- **Cache Invalidation:** Triggered when `transformed_data.csv` modification time changes
- **Lifetime:** Per-process, persists until file update or server restart
- **Scope:** Shared across all analytics routes

---

## 3. API Communication Flow

### 3.1 Request Lifecycle

```
Browser                        Frontend (Vite)                Backend (FastAPI)
   │                                │                              │
   │  User navigates to page        │                              │
   │───────────────────────────────>│                              │
   │                                │                              │
   │                                │  React component mounts      │
   │                                │  useEffect triggers fetch    │
   │                                │                              │
   │                                │  Axios GET /api/endpoint     │
   │                                │─────────────────────────────>│
   │                                │                              │
   │                                │                              │  Load cached
   │                                │                              │  DataFrame
   │                                │                              │  │
   │                                │                              │  <──┘
   │                                │                              │
   │                                │                              │  Process data
   │                                │                              │  (Pandas ops)
   │                                │                              │  │
   │                                │                              │  <──┘
   │                                │                              │
   │                                │  JSON Response               │
   │                                │<─────────────────────────────│
   │                                │                              │
   │                                │  Update React state          │
   │                                │  Re-render components        │
   │                                │                              │
   │  UI updated with data          │                              │
   │<───────────────────────────────│                              │
```

### 3.2 Data Flow Patterns

| Pattern | Endpoints | Description |
|---------|-----------|-------------|
| **Read** | GET /api/* | Fetch transformed data, compute analytics |
| **Write** | POST /api/upload | Upload file, store to disk |
| **Process** | POST /api/process-sheet | Transform and persist dataset |
| **Export Streaming** | POST /api/export-forecast | Stream large CSV/XLSX responses |

### 3.3 Error Handling Strategy

```python
# Standard pattern across all endpoints
try:
    result = process_data(df)
    return result
except HTTPException:
    raise  # Re-raise known HTTP exceptions
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Descriptive error: {str(e)}"}
    )
```

- **400:** Bad Request (invalid data, missing columns, empty sheets)
- **404:** Not Found (file not found, no data)
- **500:** Internal Server Error (processing failures, unexpected errors)

---

## 4. Upload Pipeline

### 4.1 Sequence Diagram

```
User                    Frontend                    Backend                    Disk
──┼────────────────────────┼──────────────────────────┼─────────────────────────┼──
  │                        │                          │                          │
  │  1. Select File        │                          │                          │
  │───────────────────────>│                          │                          │
  │                        │                          │                          │
  │  2. POST /api/upload   │                          │                          │
  │<───────────────────────│  (FormData: file)        │                          │
  │                        │─────────────────────────>│                          │
  │                        │                          │  3. Generate UUID        │
  │                        │                          │  4. Stream to disk       │
  │                        │                          │─────────────────────────>│
  │                        │                          │                          │
  │                        │   5. Response:           │                          │
  │                        │   {file_id, sheets}      │                          │
  │                        │<─────────────────────────│                          │
  │                        │                          │                          │
  │  6. Select Sheet       │                          │                          │
  │───────────────────────>│                          │                          │
  │                        │                          │                          │
  │  7. POST /process-sheet│                          │                          │
  │                        │  {file_id, sheet_name}   │                          │
  │                        │─────────────────────────>│                          │
  │                        │                          │  8. Read CSV/Excel       │
  │                        │                          │─────────────────────────>│
  │                        │                          │                          │
  │                        │                          │  9. Transform dataset    │
  │                        │                          │  (wide → long format)    │
  │                        │                          │                          │
  │                        │                          │  10. Save transformed    │
  │                        │                          │─────────────────────────>│
  │                        │                          │                          │
  │                        │   11. Response:          │                          │
  │                        │   {total_rows, columns,  │                          │
  │                        │    total_parts,          │                          │
  │                        │    total_demand,         │                          │
  │                        │    sample_data}          │                          │
  │                        │<─────────────────────────│                          │
  │                        │                          │                          │
  │  12. Show confirmation │                          │                          │
  │<───────────────────────│                          │                          │
```

### 4.2 Transformation Logic

```python
def transform_dataset(df):
    # 1. Check if dataset is already in long format
    if "Month" in df.columns and "Demand" in df.columns:
        return df.copy()
    
    # 2. Wide-to-long pivot
    exclude_cols = ["Part No", "part description", "category", ...]
    month_columns = [col for col in df.columns if col not in exclude_cols]
    
    df_long = df.melt(
        id_vars=["Part No"],
        value_vars=month_columns,
        var_name="Month",
        value_name="Demand"
    )
    
    # 3. Clean and normalize
    df_long["Demand"] = pd.to_numeric(df_long["Demand"], errors="coerce").fillna(0)
    df_long["Month"] = pd.to_datetime(df_long["Month"], format="mixed", errors="coerce")
                          .dt.strftime("%b-%Y").fillna(df_long["Month"])
    
    return df_long
```

### 4.3 Validation Rules

| Check | Condition | Error |
|-------|-----------|-------|
| File exists | `file.file` is not None | 400: No file uploaded |
| Sheet is not empty | `df.empty == False` | 400: Empty or invalid sheet |
| Part No column exists | `"Part No" in df.columns` | 400: Missing required column |
| Data transformable | `transform_dataset()` succeeds | 400: Invalid time-series format |

---

## 5. Forecasting Workflow

### 5.1 End-to-End Flow

```
┌──────────┐     ┌──────────────┐     ┌────────────────┐
│ Monthly  │────>│ SKU State    │────>│ Forecasting    │
│ Demand   │     │ Classifier   │     │ Strategy       │
│ Fetch    │     │              │     │ Selector       │
└──────────┘     └──────────────┘     └────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────┐
                    ▼                          ▼              ▼
             ┌─────────────┐          ┌──────────────┐ ┌─────────┐
             │ PART_LEVEL  │          │ HALB_FALLBACK│ │GLOBAL   │
             │ (Active)    │          │ (Sparse/     │ │FALLBACK │
             │             │          │  Dormant)    │ │         │
             └──────┬──────┘          └──────┬───────┘ └────┬────┘
                    │                        │              │
                    ▼                        ▼              ▼
             ┌──────────────────────────────────────────────────┐
             │            Forecast Calculator                    │
             │  • 3-month rolling average (non-sparse)          │
             │  • Non-zero moving average (sparse)              │
             │  • 12-month iterative forward projection         │
             │  • Intermittent demand spike modeling            │
             └──────────────────────┬───────────────────────────┘
                                    │
                                    ▼
             ┌──────────────────────────────────────────────────┐
             │           Post-Processing                         │
             │  • Confidence scoring                            │
             │  • Amplitude safeguarding                        │
             │  • JSON compliance cleanup (NaN → null)          │
             │  • State metadata attachment                     │
             └──────────────────────────────────────────────────┘
```

### 5.2 SKU State Classification

| State | Condition | Forecast Source | Confidence |
|-------|-----------|-----------------|------------|
| **INACTIVE** | Total demand = 0 | NO_FORECAST | NONE |
| **DORMANT** | Non-zero months ≤ 2 | LOW_CONFIDENCE | LOW |
| **SPARSE** | Sparsity > 0.7 or non-zero < 6 | HALB_FALLBACK | MEDIUM |
| **ACTIVE** | Sufficient demand history | PART_LEVEL | HIGH |

### 5.3 Confidence Scoring

```
ACTIVE SKUs:
  confidence_score = 99 - (CV × 10) - (sparsity × 15)
  Range: 75–99

SPARSE SKUs:
  confidence_score = max(45, 75 - (sparsity × 30))

DORMANT SKUs:
  confidence_score = max(15, 35 - (sparsity × 20))
```

### 5.4 Sparse Demand Forecasting

```
1. Detect sparsity: (total_months - non_zero) / total_months > 0.5
2. Calculate baseline = mean of last 3 non-zero demand values
3. Determine trend multiplier from fallback (HALB/GLOBAL)
4. Generate intermittent spikes:
   - Seed RNG with part_no hash for reproducibility
   - Probability of spike = max(0.1, min(0.9, 1.0 - sparsity))
   - Scale: spike_multiplier = 1.0 / prob_demand
5. Amplitude safeguard: cap at max(sku_max × 1.5, baseline × 2.0)
```

---

## 6. Recommendation Engine Pipeline

### 6.1 Architecture

```
┌──────────────────────────────┐
│      Risk Engine Output      │
│  [{Part No, Risk, Volatility,│
│    Sparsity, ForecastGrowth, │
│    RiskScore, State, ...}]   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│   AI Insight Generator        │
│  ┌────────────────────────┐  │
│  │ Rule-Based Engine      │  │
│  │ (generateInsightsFrom  │  │
│  │ Data)                  │  │
│  └───────────┬────────────┘  │
│              │                │
│  ┌───────────▼────────────┐  │
│  │ Fallback Templates     │  │
│  │ (offline resilience)   │  │
│  └────────────────────────┘  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  Gemini API Integration       │
│  (enhanced intelligence)      │
│  ┌────────────────────────┐  │
│  │ Prompt Engineering     │  │
│  │ + Context Injection    │  │
│  └────────────────────────┘  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     Insight Delivery          │
│  ┌────────────────────────┐  │
│  │ Severity Classification │  │
│  │ CRITICAL | WARNING |    │  │
│  │ OPTIMIZATION | INFO     │  │
│  └────────────────────────┘  │
└──────────────────────────────┘
```

### 6.2 Recommendation Rules

| Risk Score Threshold | Risk Level | Recommendation |
|----------------------|------------|----------------|
| ≥ 0.7 | HIGH | Increase Safety Stock |
| ≥ 0.4 | MEDIUM | Monitor Demand Closely |
| < 0.4 | LOW | Maintain Current Levels |

### 6.3 Insight Classification

| Severity | Trigger | Example |
|----------|---------|---------|
| CRITICAL | High-risk SKUs detected | "X SKUs at high stock-out risk" |
| WARNING | Forecast surge or high volatility | "Significant forecast surge for Y components" |
| OPTIMIZATION | Safety stock opportunities | "Z items may benefit from safety stock reduction" |
| INFO | Model status, fallback activation | "Fallback models activated for sparse-demand SKUs" |

---

## 7. Export System

### 7.1 Architecture

```
┌────────────┐     ┌────────────────┐     ┌───────────────┐
│ Export     │────>│ Data Generator  │────>│ Output Format │
│ Request    │     │ (Async Gen)     │     │ Selector      │
│ ─────────  │     │                 │     │               │
│ parts[]    │     │ • Iterate parts │     │ CSV → Stream  │
│ horizon    │     │ • Get forecast  │     │ XLSX → Temp   │
│ format     │     │ • Risk metadata │     │ File → Stream │
└────────────┘     └────────────────┘     └───────────────┘
```

### 7.2 Streaming Implementation

```python
# CSV: Row-by-row streaming via generator
async def data_generator():
    yield header.encode('utf-8')
    for part_no in part_list:
        yield csv_row.encode('utf-8')

# XLSX: Write to temp file, stream chunks
async def excel_stream_generator():
    with tempfile.NamedTemporaryFile(suffix=".xlsx") as tmp:
        workbook = pd.ExcelWriter(tmp, engine='xlsxwriter')
        # ... write rows ...
        workbook.close()
        tmp.seek(0)
        while chunk := tmp.read(65536):
            yield chunk
```

### 7.3 Export Schema

| Column | Type | Source |
|--------|------|--------|
| Part Number | String | Parts list |
| Part Name | String | Risk engine (if available) |
| Forecast Month | String (MMM-YYYY) | Generated forecast |
| Forecast Value | Float | Forecast calculation |
| Confidence Lower | Float | Forecast × 0.85 |
| Confidence Upper | Float | Forecast × 1.15 |
| Risk Level | String (HIGH/MEDIUM/LOW) | Risk engine |
| Demand Trend | String (UP/DOWN/STABLE) | Risk engine |
| Forecast Generated Date | DateTime | Current timestamp |

### 7.4 Limitations

- **Max export rows:** 50,000 (configurable in code)
- **Format note:** CSV export is truly streaming; XLSX requires full generation before streaming
- **Memory impact:** CSV uses ~1 row in memory; XLSX uses full temp file

---

## 8. Deployment Architecture

```
                         Internet
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
      ┌───────────────┐          ┌──────────────────┐
      │   Vercel      │          │ HuggingFace Spaces│
      │   (Frontend)  │          │   (Backend)       │
      │               │          │                   │
      │  ┌─────────┐  │          │  ┌─────────────┐  │
      │  │ Vite    │  │  HTTP/   │  │  FastAPI     │  │
      │  │ Build   │──│─────────│──│  (Uvicorn)    │  │
      │  │ (SPA)   │  │  JSON    │  │              │  │
      │  └─────────┘  │          │  │  ┌─────────┐ │  │
      │               │          │  │  │Pandas   │ │  │
      │  ┌─────────┐  │          │  │  │ Engine  │ │  │
      │  │ Static  │  │          │  │  └─────────┘ │  │
      │  │ Assets  │  │          │  │              │  │
      │  └─────────┘  │          │  │  ┌─────────┐ │  │
      └───────────────┘          │  │  │ CSV     │ │  │
                                 │  │  │ Storage │ │  │
                                 │  │  └─────────┘ │  │
                                 │  └──────────────┘  │
                                 └────────────────────┘
```

---

## 9. HuggingFace / Vercel Integration

### 9.1 HuggingFace Spaces Configuration

- **SDK:** Docker
- **Port:** 7860 (HF default)
- **Build:** Dockerfile in `backend/`
- **Environment Variables:** Set via Space settings UI

### 9.2 Vercel Configuration

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** `VITE_API_BASE_URL` set to HF Space URL

### 9.3 CORS Configuration

```python
# main.py
origins = [
    "http://localhost:5173",
    os.environ.get("FRONTEND_URL")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Wildcard for broad compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 10. Data Lifecycle

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌───────────┐
│ Upload   │────>│ Raw Storage   │────>│ Transform    │────>│ Transformed│
│ (CSV/    │     │ (uploads/     │     │ (wide→long)  │     │ Dataset    │
│  XLSX)   │     │  uuid.*)      │     │              │     │ (data/     │
└──────────┘     └──────────────┘     └──────────────┘     │transformed │
                                                            │_data.csv) │
                                                            └─────┬─────┘
                                                                  │
                    ┌─────────────────────────────────────────────┼──────┐
                    │                    │                        │      │
                    ▼                    ▼                        ▼      │
            ┌──────────────┐    ┌──────────────┐        ┌──────────┐   │
            │ In-Memory    │    │ Forecast     │        │ Export   │   │
            │ Cache (DF)   │    │ Computation  │        │ Generator│   │
            └──────────────┘    └──────────────┘        └──────────┘   │
                    │                    │                        │      │
                    ▼                    ▼                        ▼      │
            ┌───────────────────────────────────────────────────────────┘
            │  Memory freed when new upload triggers cache invalidation
            ▼
      Garbage Collection
```

### 10.1 Data Persistence

| Stage | Store | Format | Duration |
|-------|-------|--------|----------|
| Raw upload | `uploads/` | Original file format | Until overwritten or manually cleaned |
| Transformed | `data/transformed_data.csv` | CSV (long format) | Persistent, overwritten on each process |
| Cache | In-memory (Python) | Pandas DataFrame | Process lifetime, invalidated on file change |

### 10.2 Cache Invalidation Trigger

```
1. POST /api/process-sheet succeeds
2. transformed_data.csv is overwritten
3. File modification time (mtime) updates
4. Next GET request detects mtime change
5. _cached_df is reloaded from disk
6. Old DataFrame is garbage collected
```

---

*End of Architecture Guide*