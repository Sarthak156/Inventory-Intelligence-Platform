# Known Issues

**Inventory Intelligence Platform — Known Issues & Workarounds**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [HF Spaces Memory Limits](#1-hf-spaces-memory-limits)
2. [Large Export Performance Issues](#2-large-export-performance-issues)
3. [Chart Rendering Limitations](#3-chart-rendering-limitations)
4. [Backend Cold Starts](#4-backend-cold-starts)
5. [Frontend Runtime Edge Cases](#5-frontend-runtime-edge-cases)
6. [Recharts Container Warnings](#6-recharts-container-warnings)
7. [Production Limitations](#7-production-limitations)

---

## 1. HF Spaces Memory Limits

### Issue
HuggingFace Spaces free tier has 8GB RAM limit. Large datasets (>500K rows) can cause out-of-memory errors.

### Symptoms
- Backend crashes with `MemoryError`
- HF Space shows "Out of Memory" status
- API returns 500 errors after processing large files

### Root Cause
The entire transformed dataset is loaded into memory as a Pandas DataFrame. CSV exports also build risk data in memory before streaming.

### Workaround
- Upload files smaller than 10MB
- Remove unnecessary columns before uploading
- Use CSV for exports instead of XLSX
- Process only essential sheets

### Planned Fix
- Implement chunked DataFrame processing
- Add Redis-based distributed caching (Phase 1)
- Move to Parquet format with partitioning (Phase 2)

**Priority:** High  
**Status:** Mitigation in place, full fix in Phase 1

---

## 2. Large Export Performance Issues

### Issue
Export with `ALL_PARTS` and 12-month horizon for datasets with 1000+ SKUs can take 30+ seconds.

### Symptoms
- Export response hangs for extended periods
- Browser download may timeout
- HF Space may OOM during export

### Root Cause
Export iterates sequentially over all parts, computing forecast for each. No parallelization.

### Workaround
- Select specific parts instead of "ALL_PARTS"
- Reduce forecast horizon to 3-6 months
- Use CSV format (streaming, lower memory)
- Export in batches of 100-200 parts

### Planned Fix
- Background task queue for async exports (Phase 2)
- Parallel forecast computation
- Chunked streaming with progress indicator

**Priority:** High  
**Status:** Known limitation, workaround available

---

## 3. Chart Rendering Limitations

### Issue
Recharts SVG rendering can become slow when displaying 50+ data points on a single chart.

### Symptoms
- Dashboard chart animation is janky
- High CPU usage when hovering over tooltips
- Chart re-renders on every state update

### Root Cause
Recharts re-renders the entire SVG on every prop change. No virtualization for chart data.

### Workaround
- Data aggregation reduces points (12-month horizon shown as 12 bars)
- Avoid rapid state changes near chart components
- Use `React.memo` on chart wrapper components

### Planned Fix
- Implement data downsampling for large datasets
- Add `shouldComponentUpdate` optimization
- Consider switching to Canvas-based charting (e.g., uPlot)

**Priority:** Medium  
**Status:** Acceptable with current data sizes

---

## 4. Backend Cold Starts

### Issue
HuggingFace Spaces free tier spins down after 48 hours of inactivity. First request after idle period takes 20-60 seconds.

### Symptoms
- First page load after weekend shows "Failed to connect"
- Subsequent requests are fast (<500ms)
- Dashboard times out on first load

### Root Cause
HF Spaces free tier containers are terminated during inactivity. Docker image must restart on demand.

### Workaround
- Use a cron job to ping the endpoint every 30 minutes
- HF Pro subscription for always-on instances
- Users should wait 30-60 seconds on first daily use

### Planned Fix
- Implement client-side retry logic with exponential backoff
- Add "Waking up service..." loading state
- Upgrade to HF Pro for production deployments

**Priority:** Medium  
**Status:** Expected behavior for free tier

---

## 5. Frontend Runtime Edge Cases

### 5.1 Empty State Handling

**Issue:** Pages may show broken UI when no data has been uploaded.

**Symptoms:**
- Dashboard shows all zeros or empty charts
- Forecast page has empty dropdown
- Inventory page shows "0 items"

**Root Cause:** Components assume data exists; missing comprehensive empty states.

**Workaround:** Upload and process data before navigating to analytics pages.

**Planned Fix:** Add proper empty states with guidance messages.

### 5.2 Concurrent Upload Interruption

**Issue:** Navigating away from Upload page during processing leaves the system in an undefined state.

**Symptoms:**
- Partially processed data may be saved
- Subsequent uploads may conflict

**Root Cause:** No abort controller or cleanup on unmount.

**Workaround:** Wait for processing to complete before navigating.

**Planned Fix:** Add upload abort controller and cleanup on unmount.

### 5.3 Browser Back Button

**Issue:** Using browser back button may show stale cached data.

**Symptoms:**
- Old data appears after navigation
- Components don't refetch on mount

**Root Cause:** React Router's default behavior caches previous route.

**Workaround:** Manual refresh after using back button.

**Planned Fix:** Add route-level data refresh.

**Priority:** Low  
**Status:** Known edge cases

---

## 6. Recharts Container Warnings

### Issue
Recharts outputs `Warning: `width` and `height` should be numbers` when container dimensions are not yet available.

### Symptoms
- Console warnings (not visible to end users)
- Charts may not render on initial load

### Root Cause
Recharts `ResponsiveContainer` calculates dimensions on mount. If the parent container has not yet been sized (e.g., during SSR or initial render), the warning appears.

### Workaround
- Wrap charts in a div with explicit height
- Ignore warnings (they are harmless)
- Use `min-width: 0` on chart containers

### Planned Fix
- Set explicit container dimensions
- Add `debounce` to resize handler

**Priority:** Low  
**Status:** Cosmetic, no functional impact

---

## 7. Production Limitations

### 7.1 Single-User Concurrency

**Issue:** The backend processes all requests sequentially for dataset operations.

**Impact:** Multiple users uploading simultaneously may cause race conditions on `transformed_data.csv`.

**Workaround:** Stagger uploads, avoid concurrent usage.

**Planned Fix:** Implement file locking or per-user datasets.

### 7.2 No Authentication

**Issue:** The platform has no user authentication or authorization.

**Impact:** Anyone with the URL can access all data and functionality.

**Workaround:** Deploy on private network or VPN.

**Planned Fix:** Authentication and RBAC (Phase 1).

### 7.3 Ephemeral Storage

**Issue:** HuggingFace Spaces storage is ephemeral. Container restarts lose uploaded files.

**Impact:** Users must re-upload data after container restart.

**Workaround:** Keep copies of source data locally.

**Planned Fix:** Persistent database storage (Phase 2).

### 7.4 No HTTPS Enforcement

**Issue:** Development setup uses HTTP only.

**Impact:** Data transmitted in plain text on local network.

**Workaround:** Production deployments (Vercel + HF) have HTTPS by default.

**Planned Fix:** N/A for development; production uses HTTPS.

**Priority:** Medium  
**Status:** Acceptable for current deployment model

---

## Issue Tracking

| ID | Issue | Severity | Status | Target Fix |
|----|-------|----------|--------|------------|
| KN-001 | HF Space memory limits on large datasets | High | Mitigated | Phase 1 |
| KN-002 | Slow export with ALL_PARTS | High | Workaround | Phase 2 |
| KN-003 | Chart rendering performance | Medium | Acceptable | Phase 2 |
| KN-004 | Backend cold starts on HF free tier | Medium | Workaround | Phase 1 |
| KN-005 | Missing empty states on pages | Low | Known | Phase 1 |
| KN-006 | Upload interruption on navigation | Low | Known | Phase 1 |
| KN-007 | Recharts container dimension warnings | Low | Cosmetic | Backlog |
| KN-008 | Single-user data race condition | Medium | Known | Phase 2 |
| KN-009 | No authentication/authorization | Medium | Known | Phase 1 |
| KN-010 | Ephemeral storage on HF Spaces | Medium | Known | Phase 2 |

---

*End of Known Issues*