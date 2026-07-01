# System Design Document

**Inventory Intelligence Platform — System Design**

**Version:** 1.0.0  
**Last Updated:** July 2026  
**Status:** Production

---

## Table of Contents

1. [System Components](#1-system-components)
2. [Module Interactions](#2-module-interactions)
3. [Scalability Considerations](#3-scalability-considerations)
4. [State Management](#4-state-management)
5. [Deployment Topology](#5-deployment-topology)
6. [Caching Strategy](#6-caching-strategy)
7. [Performance Considerations](#7-performance-considerations)
8. [Production Architecture](#8-production-architecture)

---

## 1. System Components

### 1.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         INVENTORY INTELLIGENCE PLATFORM                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        FRONTEND (React SPA)                          │   │
│  │                                                                      │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────────┐ │   │
│  │  │  Dashboard   │ │  Forecast   │ │  Inventory  │ │Recommendations│ │   │
│  │  │  Component   │ │  Component  │ │  Component  │ │  Component    │ │   │
│  │  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └───────┬───────┘ │   │
│  │         │               │               │                │          │   │
│  │  ┌──────┴───────────────┴───────────────┴────────────────┴──────┐   │   │
│  │  │                    API Service Layer (Axios)                  │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       BACKEND (FastAPI)                              │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Upload API  │  │  Analytics   │  │  Forecast    │              │   │
│  │  │  Router      │  │  Router      │  │  Router      │              │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │   │
│  │         │                 │                 │                       │   │
│  │  ┌──────┴─────────────────┴─────────────────┴──────────────────┐   │   │
│  │  │                    Service Layer                              │   │   │
│  │  │  ┌─────────────────┐  ┌──────────────────────────────────┐   │   │   │
│  │  │  │  Risk Engine    │  │  Data Transformer                │   │   │   │
│  │  │  │  (Scoring)      │  │  (Wide→Long Format)              │   │   │   │
│  │  │  └─────────────────┘  └──────────────────────────────────┘   │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Data Layer                                  │   │   │
│  │  │  ┌─────────────────┐  ┌──────────────────────────────────┐   │   │   │
│  │  │  │  In-Memory      │  │  CSV File Store                  │   │   │   │
│  │  │  │  DataFrame Cache│  │  (transformed_data.csv)          │   │   │   │
│  │  │  └─────────────────┘  └──────────────────────────────────┘   │   │   │
│  │  └──────────────────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Component Inventory

| Component | Type | Technology | Responsibility |
|-----------|------|------------|----------------|
| **Dashboard** | Page | React | KPI monitoring, risk visualization, AI insights |
| **Forecast** | Page | React | Per-SKU demand forecasting, export |
| **Inventory** | Page | React | Data browsing, search, filtering |
| **Risks** | Page | React | Risk assessment, scoring details |
| **Recommendations** | Page | React | AI-driven operational recommendations |
| **Upload** | Page | React | File upload, sheet selection, processing |
| **Settings** | Page | React | Application configuration |
| **Sidebar** | Component | React | Navigation, route switching |
| **AI Components** | Components | React | AI insight panels, status indicators |
| **Recommendation Components** | Components | React | Tables, filters, modals, pagination |
| **DataContext** | Context | React | Shared data state management |
| **API Service** | Service | Axios | HTTP communication with backend |
| **Upload Router** | API | FastAPI | File upload, sheet processing |
| **Analytics Router** | API | FastAPI | Forecasting, risk, inventory, export |
| **Forecast Router** | API | FastAPI | Legacy forecast endpoint |
| **Risk Engine** | Service | Python | Inventory risk scoring algorithm |
| **Data Transformer** | Utility | Python | Wide-to-long format conversion |
| **Data Validator** | Validation | Python | Input data validation |
| **Data Cache** | Cache | Python dict | In-memory DataFrame caching |

---

## 2. Module Interactions

### 2.1 Data Flow Matrix

```
              ┌──────┬──────┬──────┬──────┬──────┬──────┬──────┐
              │Upload│Analyt│Forec │Risk  │Data  │Export│Cache │
              │      │ics   │ast   │Engine│Transf│      │      │
┌─────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Upload API  │  ─   │  ─   │  ─   │  ─   │  ✓   │  ─   │  ─   │
├─────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Analytics   │  ─   │  ─   │  ─   │  ✓   │  ─   │  ─   │  ✓   │
├─────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Risk Engine │  ─   │  ─   │  ─   │  ─   │  ─   │  ─   │  ─   │
├─────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Data Transf │  ─   │  ─   │  ─   │  ─   │  ─   │  ─   │  ─   │
├─────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Export      │  ─   │  ✓   │  ─   │  ✓   │  ─   │  ─   │  ✓   │
├─────────────┼──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ Cache       │  ─   │  ✓   │  ─   │  ─   │  ─   │  ─   │  ─   │
└─────────────┴──────┴──────┴──────┴──────┴──────┴──────┴──────┘

✓ = Direct dependency
─ = No direct dependency
```

### 2.2 Critical Interaction Paths

#### Path 1: Upload → Process → Analytics
```
POST /api/upload
  → File streamed to disk (uploads/{uuid}.xlsx)
  → Returns file_id, sheet_names

POST /api/process-sheet {file_id, sheet_name}
  → Read file from disk
  → DataTransformer.transform_dataset() (wide → long)
  → Save to data/transformed_data.csv
  → Cache invalidated (mtime changes)
  → Returns dataset metrics

GET /api/monthly-demand
  → get_cached_df() (reloads if mtime changed)
  → Computes forecast
  → Returns demand + forecast data
```

#### Path 2: Risk Assessment
```
GET /api/inventory-risk
  → get_cached_df()
  → RiskEngine.calculate_inventory_risk(df)
    → Group by Part No
    → For each SKU:
      → Calculate volatility (std/mean)
      → Calculate sparsity (zeros/total)
      → Calculate forecast growth
      → Compute weighted risk score
      → Classify state (Stable/Volatile/Sparse/Dormant/Surging)
      → Generate recommendation
  → Return sorted risk data
```

#### Path 3: Export
```
POST /api/export-forecast {parts, horizon, format}
  → Validate format (csv/xlsx)
  → Load cached DataFrame
  → Calculate risk data for metadata
  → For each part:
    → Get monthly demand + forecast
    → Extract future forecast rows (up to horizon)
    → Attach risk metadata
    → Yield row (CSV) or collect (XLSX)
  → Stream response
```

---

## 3. Scalability Considerations

### 3.1 Current Architecture Limitations

| Constraint | Current State | Impact |
|------------|--------------|--------|
| **Data Storage** | Single CSV file | Not suitable for large datasets (>100MB) |
| **In-Memory Cache** | Single process DataFrame | Memory-bound, not distributed |
| **Processing** | Single-threaded Pandas | CPU-bound for large datasets |
| **Concurrency** | Uvicorn with async | Limited by GIL for Pandas ops |
| **File Storage** | Local disk (uploads/) | Not persistent across deployments |
| **Export** | 50,000 row limit | Hard ceiling for large exports |

### 3.2 Scaling Strategy

#### Short-term (Current Architecture)
- **Optimize Pandas:** Use `low_memory=False`, vectorized operations, chunked reading
- **Streaming:** Generator-based export to minimize memory footprint
- **Cache Invalidation:** mtime-based to avoid unnecessary reloads

#### Medium-term (Phase 1-2)
- **Redis Cache:** Replace in-memory dict with Redis for distributed caching
- **Async Processing:** Background task queue (Celery/Redis Queue) for exports
- **Database:** Migrate from CSV to PostgreSQL for structured querying

#### Long-term (Phase 3)
- **Microservices:** Split monolith into dedicated services (Forecast, Risk, Export)
- **Data Lake:** Parquet-based storage with partitioning
- **Auto-scaling:** Horizontal pod autoscaling with Kubernetes

### 3.3 Bottleneck Analysis

```
Bottleneck: DataFrame Loading
  Impact: All analytics endpoints depend on get_cached_df()
  Current: ~500ms load time for 100K rows
  Mitigation: mtime-based cache reduces reloads

Bottleneck: Risk Engine Computation
  Impact: O(n) per SKU, n = number of months
  Current: ~2s for 1000 SKUs × 24 months
  Mitigation: Vectorized NumPy operations

Bottleneck: Export Generation
  Impact: Sequential per-SKU forecast computation
  Current: ~5s per 100 parts
  Mitigation: Streaming response, row limit
```

---

## 4. State Management

### 4.1 Frontend State Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Application                      │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              DataContext (Global)                  │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Upload State │  │  Data State  │              │   │
│  │  │  - fileId     │  │  - rows      │              │   │
│  │  │  - sheets     │  │  - columns   │              │   │
│  │  │  - processing │  │  - totalParts│              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              ReactContexts (Global)                │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Theme State  │  │  UI State    │              │   │
│  │  │  - darkMode   │  │  - sidebar   │              │   │
│  │  │  - colors     │  │  - layout    │              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Local Component State                 │   │
│  │  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │  Page State   │  │  UI State    │              │   │
│  │  │  - loading    │  │  - modals    │              │   │
│  │  │  - data       │  │  - filters   │              │   │
│  │  │  - error      │  │  - pagination│              │   │
│  │  └──────────────┘  └──────────────┘              │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### 4.2 State Flow Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| **Fetch-on-Render** | Component mounts → fetch data → render | Dashboard, Forecast pages |
| **Lazy Load** | Data fetched on user interaction | Export modal, sheet selection |
| **Optimistic Update** | UI updates before API confirms | Upload progress indicator |
| **Error Boundary** | Catch render errors, show fallback | AI insight fallback templates |

### 4.3 Backend State

| State Type | Location | Scope | Lifetime |
|------------|----------|-------|----------|
| DataFrame Cache | `_cached_df` (module global) | All analytics routes | Process lifetime |
| File Modification Time | `_cached_mtime` (module global) | Cache invalidation | Process lifetime |
| Uploaded Files | `uploads/` directory | Per-upload | Until cleanup |
| Transformed Data | `data/transformed_data.csv` | Global dataset | Until reprocessed |

---

## 5. Deployment Topology

### 5.1 Current Topology

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
┌──────────────────────┐   ┌──────────────────────────────┐
│   Vercel Edge Network │   │   HuggingFace Spaces         │
│                      │   │                              │
│  ┌────────────────┐  │   │  ┌────────────────────────┐  │
│  │  Static Assets  │  │   │  │  FastAPI (Uvicorn)     │  │
│  │  (CDN Cached)   │  │   │  │  Port: 7860            │  │
│  └────────────────┘  │   │  └────────────────────────┘  │
│                      │   │                              │
│  ┌────────────────┐  │   │  ┌────────────────────────┐  │
│  │  React SPA      │  │   │  │  Pandas/NumPy Engine   │  │
│  │  (Browser)      │  │   │  └────────────────────────┘  │
│  └────────────────┘  │   │                              │
│                      │   │  ┌────────────────────────┐  │
│  ┌────────────────┐  │   │  │  CSV File Store        │  │
│  │  API Proxy      │  │   │  │  (Ephemeral)           │  │
│  │  (Vite Dev)     │  │   │  └────────────────────────┘  │
│  └────────────────┘  │   │                              │
└──────────────────────┘   └──────────────────────────────┘
```

### 5.2 Network Topology

| Hop | Source | Destination | Protocol | Latency |
|-----|--------|-------------|----------|---------|
| 1 | Browser | Vercel Edge | HTTPS | ~50ms |
| 2 | Browser | HF Spaces API | HTTPS | ~200ms |
| 3 | Vite Dev Server | FastAPI (local) | HTTP | ~1ms |

### 5.3 Resource Requirements

| Component | CPU | Memory | Storage | Network |
|-----------|-----|--------|---------|---------|
| Frontend (Vercel) | - | - | Static ~2MB | 100Mbps |
| Backend (HF Spaces) | 2 vCPU | 8GB RAM | 10GB | 1Gbps |
| CSV Storage | - | - | ~50MB | - |

---

## 6. Caching Strategy

### 6.1 Cache Layers

```
Layer 1: Browser Cache
  - Static assets (JS, CSS, images)
  - Cache-Control: max-age=31536000, immutable
  - Served via Vercel CDN

Layer 2: In-Memory DataFrame Cache
  - Backend process memory
  - Key: file modification time
  - Value: Pandas DataFrame
  - Invalidated on file change

Layer 3: AI Insight Cache
  - Frontend utility (aiInsightCache.js)
  - Key: insight query parameters
  - Value: Generated insights
  - TTL: Session-based
```

### 6.2 Cache Performance

| Cache | Hit Rate (est.) | Access Time | Memory Impact |
|-------|-----------------|-------------|---------------|
| Browser (static) | 95% | ~5ms | 0 (disk cache) |
| DataFrame | 90% | ~0.1ms | ~100MB (100K rows) |
| AI Insights | 80% | ~0.5ms | ~1MB |

### 6.3 Cache Invalidation Rules

| Trigger | Action | Impact |
|---------|--------|--------|
| New file upload | No direct impact | Upload cache unaffected |
| Sheet processed | DataFrame cache cleared | All analytics endpoints reload |
| Server restart | All caches cleared | Cold start for all requests |
| Browser refresh | AI insight cache cleared | Insights regenerated |

---

## 7. Performance Considerations

### 7.1 Frontend Performance

| Concern | Current State | Optimization |
|---------|--------------|--------------|
| Bundle Size | ~500KB JS + CSS | Vite code splitting, tree shaking |
| Chart Rendering | Recharts SVG | `React.memo` on chart components |
| List Rendering | Standard map() | React Window for virtualized lists |
| API Calls | Sequential in some pages | `Promise.all` for parallel requests |
| Re-renders | Context updates | Memoized selectors, `useMemo` |

### 7.2 Backend Performance

| Concern | Current State | Optimization |
|---------|--------------|--------------|
| DataFrame Load | Full CSV read | `low_memory=False`, chunked reading |
| Forecast Computation | Per-SKU sequential | Vectorized operations |
| Risk Calculation | GroupBy + loop | NumPy vectorized where possible |
| Export Generation | Sequential parts | Generator-based streaming |
| JSON Serialization | `to_dict(orient="records")` | `replace([inf, -inf], nan)` pre-cleanup |

### 7.3 Performance Benchmarks

| Operation | Dataset Size | Time | Memory |
|-----------|-------------|------|--------|
| CSV Load | 100K rows × 15 cols | ~500ms | ~150MB |
| Forecast (ALL_PARTS) | 100K rows | ~800ms | ~200MB |
| Risk Calculation | 1000 SKUs | ~2s | ~250MB |
| Export (100 parts) | CSV | ~5s | ~50MB |
| Export (100 parts) | XLSX | ~8s | ~100MB |

---

## 8. Production Architecture

### 8.1 Production-Ready Architecture (Target)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Production Architecture                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                    CDN (Cloudflare/Vercel)                     │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
│                             │                                        │
│              ┌──────────────┴──────────────┐                        │
│              │                             │                        │
│              ▼                             ▼                        │
│  ┌──────────────────────┐     ┌──────────────────────────────┐     │
│  │   Vercel (Frontend)  │     │   HuggingFace Spaces (API)   │     │
│  │   - React SPA        │     │   - FastAPI                  │     │
│  │   - Static Assets    │     │   - Uvicorn Workers: 4       │     │
│  │   - Edge Functions   │     │   - Rate Limiting            │     │
│  └──────────────────────┘     └──────────────┬───────────────┘     │
│                                               │                      │
│                                               ▼                      │
│                                ┌──────────────────────────────┐     │
│                                │   Redis Cache (Upstash)      │     │
│                                │   - DataFrame Cache          │     │
│                                │   - Session Store            │     │
│                                │   - Rate Limit Counters      │     │
│                                └──────────────────────────────┘     │
│                                                                      │
│                                ┌──────────────────────────────┐     │
│                                │   PostgreSQL (Neon/Supabase)  │     │
│                                │   - Transformed Data          │     │
│                                │   - User Sessions             │     │
│                                │   - Audit Logs                │     │
│                                └──────────────────────────────┘     │
│                                                                      │
│                                ┌──────────────────────────────┐     │
│                                │   Background Workers (Celery) │     │
│                                │   - Async Exports             │     │
│                                │   - Scheduled Forecasts       │     │
│                                │   - Data Cleanup              │     │
│                                └──────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.2 Security Architecture

| Layer | Measure | Implementation |
|-------|---------|----------------|
| **Network** | HTTPS | Vercel + HF Spaces (default) |
| **API** | CORS | Configurable origins |
| **Upload** | File validation | Extension check, size limit |
| **Data** | Input sanitization | Pandas type coercion |
| **Environment** | Secrets management | `.env` files, HF Secrets |

### 8.3 Monitoring & Observability

| Component | Tool | Metrics |
|-----------|------|---------|
| Frontend | Vercel Analytics | Page views, load times, errors |
| Backend | FastAPI logging | Request duration, error rates |
| Performance | Custom logging | DataFrame load times, export duration |
| Errors | Python logging | Stack traces, error context |

---

*End of System Design Document*