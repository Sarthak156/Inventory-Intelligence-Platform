# Operations Runbook

**Inventory Intelligence Platform — Operational Procedures**

**Version:** 1.0.0  
**Last Updated:** July 2026  
**Classification:** Internal — Operations Team

---

## Table of Contents

1. [Startup Procedures](#1-startup-procedures)
2. [Restart Procedures](#2-restart-procedures)
3. [Backend Recovery](#3-backend-recovery)
4. [Upload Recovery](#4-upload-recovery)
5. [Export Recovery](#5-export-recovery)
6. [Cache Clearing](#6-cache-clearing)
7. [Memory Issue Handling](#7-memory-issue-handling)
8. [Production Incident Handling](#8-production-incident-handling)
9. [Monitoring Checklist](#9-monitoring-checklist)

---

## 1. Startup Procedures

### 1.1 Standard Startup (Local Development)

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend
npm run dev
```

**Verification Steps:**
1. Backend responds: `curl http://localhost:8000/` → `{"message":"Backend running"}`
2. Frontend loads: Open http://localhost:5173
3. API proxy works: Frontend can fetch `/api/parts`
4. Swagger UI: http://localhost:8000/docs

### 1.2 Production Startup (HuggingFace Spaces)

1. Navigate to HF Space dashboard
2. Verify Space status is **Running**
3. Check **Builder** tab for build status
4. Check **Logs** tab for runtime errors
5. Verify health endpoint: `curl https://your-space.hf.space/`

### 1.3 Docker Startup

```bash
docker-compose up --build -d
docker-compose logs -f
```

**Verification:**
```bash
curl http://localhost:8000/
curl http://localhost:5173/
```

---

## 2. Restart Procedures

### 2.1 Backend Restart (Local)

```bash
# Stop the running uvicorn process (Ctrl+C)
# Then restart:
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2.2 Backend Restart (HuggingFace Spaces)

**Method 1: Factory Restart**
1. Go to HF Space → **Settings** → **Factory Restart**
2. This clears all cached data and restarts the container

**Method 2: Code Push**
```bash
git commit --allow-empty -m "Trigger restart"
git push
```

**Method 3: Hardware Change**
1. Go to HF Space → **Settings** → **Change Hardware**
2. Select same tier and save (triggers restart)

### 2.3 Full System Restart

```bash
# Stop all
docker-compose down

# Clear data (optional)
rm -rf backend/data/transformed_data.csv
rm -rf backend/uploads/*

# Restart
docker-compose up --build -d
```

---

## 3. Backend Recovery

### 3.1 Application Crash Recovery

**Symptoms:**
- API returns 500 errors
- Frontend shows "Failed to connect to intelligence backend"
- HF Space shows "Error" status

**Recovery Steps:**

1. **Check logs:**
   ```bash
   # Local
   # Check terminal output for traceback
   
   # HF Spaces
   # Go to Logs tab in Space dashboard
   ```

2. **Identify crash cause:**
   - Out of memory error → See Section 7
   - Module import error → Check requirements.txt
   - File not found → Check data/transformed_data.csv exists
   - Port binding error → Check port 7860 is available

3. **Restart application:**
   - Local: Restart uvicorn process
   - HF Spaces: Factory Restart

4. **Verify recovery:**
   ```bash
   curl http://localhost:8000/
   curl http://localhost:8000/api/parts
   ```

### 3.2 Data Corruption Recovery

**Symptoms:**
- Analytics return empty or malformed data
- `transformed_data.csv` has incorrect format
- Risk engine returns empty results

**Recovery Steps:**

1. **Check data file:**
   ```bash
   head -5 backend/data/transformed_data.csv
   wc -l backend/data/transformed_data.csv
   ```

2. **Re-upload and process data:**
   - Navigate to Upload page
   - Upload original file
   - Process the correct sheet
   - Verify data appears in Inventory page

3. **If file is corrupted beyond repair:**
   ```bash
   rm backend/data/transformed_data.csv
   rm -rf backend/uploads/*
   ```
   Then re-upload from source.

### 3.3 Dependency Recovery

**Symptoms:**
- `ModuleNotFoundError` on startup
- Import errors in logs

**Recovery Steps:**

```bash
cd backend
source venv/bin/activate
pip install --no-cache-dir -r requirements.txt
```

**For HF Spaces:**
- Update `requirements.txt` with missing packages
- Commit and push to trigger rebuild

---

## 4. Upload Recovery

### 4.1 Upload Failure

**Symptoms:**
- Upload returns 500 error
- File upload hangs indefinitely
- "Error uploading file" message

**Recovery Steps:**

1. **Check disk space:**
   ```bash
   df -h
   du -sh backend/uploads/
   ```

2. **Clean up stale uploads:**
   ```bash
   rm -rf backend/uploads/*
   ```

3. **Verify file format:**
   - Ensure file is valid .xlsx or .csv
   - Check file is not corrupted (open in Excel)
   - Check file size is reasonable (< 50MB)

4. **Retry upload:**
   - Refresh Upload page
   - Select file again
   - Monitor network tab for errors

### 4.2 Sheet Processing Failure

**Symptoms:**
- "Invalid sheet" error
- "Data transformation failed" error
- Processing hangs

**Recovery Steps:**

1. **Check sheet structure:**
   - Verify "Part No" column exists
   - Check for merged cells in Excel
   - Ensure no empty rows/columns

2. **Check data format:**
   - Wide format: Month columns (Jan-2024, Feb-2024, ...)
   - Long format: Month and Demand columns
   - Values should be numeric

3. **Try alternative sheet:**
   - Select a different sheet from the file
   - Some sheets (Summary, Instructions) are not valid

4. **Clean and retry:**
   - Remove formatting from Excel file
   - Save as CSV and retry
   - Ensure no special characters in column names

---

## 5. Export Recovery

### 5.1 Export Failure

**Symptoms:**
- Export returns 500 error
- Download hangs or never completes
- "No data available to export" error

**Recovery Steps:**

1. **Check data availability:**
   ```bash
   curl http://localhost:8000/api/parts
   # Should return non-empty array
   ```

2. **Check export parameters:**
   - `parts`: Must be non-empty array
   - `horizon`: Must be 1-12
   - `format`: Must be "csv" or "xlsx"

3. **Reduce export size:**
   - Select fewer parts
   - Reduce horizon months
   - Use CSV instead of XLSX

4. **Check memory:**
   - Large exports may cause OOM
   - See Section 7 for memory handling

### 5.2 Partial Export Recovery

If export was interrupted mid-stream:

1. **Check how many rows were exported:**
   ```bash
   wc -l forecast_export.csv
   ```

2. **Resume with remaining parts:**
   - Identify which parts were already exported
   - Request export for remaining parts only
   - Append to existing file

---

## 6. Cache Clearing

### 6.1 Backend DataFrame Cache

The backend caches the transformed dataset in memory. Clear it by:

**Method 1: Process New Data (Recommended)**
- Upload and process a new sheet
- This automatically invalidates the cache

**Method 2: Restart Backend**
- Local: Restart uvicorn process
- HF Spaces: Factory Restart

**Method 3: Touch Data File**
```bash
touch backend/data/transformed_data.csv
```
This updates the mtime, triggering cache reload on next request.

### 6.2 Frontend Cache

**Browser Cache:**
```bash
# Hard refresh
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (macOS)
```

**Application State:**
- Refresh the page to reset component state
- Clear localStorage/sessionStorage via DevTools

### 6.3 AI Insight Cache

The frontend caches AI insights in memory. Clear by:
- Refreshing the page
- Navigating away and back to the page

---

## 7. Memory Issue Handling

### 7.1 Symptoms

- Backend crashes with `MemoryError`
- HF Space shows "Out of Memory" status
- Export fails mid-stream
- API responses become very slow

### 7.2 Immediate Actions

1. **Reduce dataset size:**
   - Upload smaller files (< 10MB)
   - Remove unnecessary columns before upload
   - Filter out inactive SKUs

2. **Clear uploads directory:**
   ```bash
   rm -rf backend/uploads/*
   ```

3. **Restart backend:**
   - Frees all cached DataFrames
   - Clears Python memory

4. **Switch to CSV format:**
   - CSV exports use less memory than XLSX
   - CSV is streamed row-by-row

### 7.3 Prevention

| Measure | Implementation |
|---------|----------------|
| **Limit upload size** | Add file size validation (recommended: 50MB max) |
| **Regular cleanup** | Schedule cleanup of `uploads/` directory |
| **Monitor memory** | Check HF Space memory usage in dashboard |
| **Use streaming** | CSV export uses generator-based streaming |
| **Cache invalidation** | mtime-based cache prevents stale data accumulation |

### 7.4 HF Space Memory Limits

| Hardware Tier | RAM | Max Dataset Size (est.) |
|---------------|-----|------------------------|
| CPU Basic (Free) | 8GB | ~500K rows |
| CPU Upgrade | 16GB | ~1M rows |
| GPU (T4) | 16GB | ~1M rows |

---

## 8. Production Incident Handling

### 8.1 Incident Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P0** | Complete system down | 15 min | Backend not responding |
| **P1** | Major feature broken | 1 hour | Export system failing |
| **P2** | Minor feature broken | 4 hours | Chart rendering issue |
| **P3** | Cosmetic issue | 24 hours | UI alignment problem |

### 8.2 Incident Response Flow

```
1. DETECT
   ├── Automated: Monitoring alert
   └── Manual: User report
        │
        ▼
2. TRIAGE
   ├── Determine severity (P0-P3)
   ├── Identify affected component
   └── Check recent changes
        │
        ▼
3. RESPOND
   ├── P0: Immediate fix or rollback
   ├── P1: Workaround + fix within 1 hour
   ├── P2: Schedule fix within 4 hours
   └── P3: Add to backlog
        │
        ▼
4. RESOLVE
   ├── Apply fix
   ├── Verify fix
   └── Deploy to production
        │
        ▼
5. POST-MORTEM
   ├── Root cause analysis
   ├── Prevention measures
   └── Update documentation
```

### 8.3 Common Incident Scenarios

#### Scenario 1: Backend Unreachable

**Symptoms:** Frontend shows "Failed to connect to intelligence backend"

**Triage:**
1. Check HF Space status (Running/Error/Building)
2. Check HF Space logs for errors
3. Test health endpoint directly

**Resolution:**
1. If building: Wait for build to complete
2. If error: Factory Restart
3. If OOM: Upgrade hardware or reduce data

#### Scenario 2: Data Processing Failure

**Symptoms:** Upload succeeds but processing fails

**Triage:**
1. Check error message in response
2. Verify file format and structure
3. Check server logs for details

**Resolution:**
1. Guide user to fix file format
2. Process with different sheet
3. If systemic: Restart backend

#### Scenario 3: Export Not Working

**Symptoms:** Export button does nothing or returns error

**Triage:**
1. Check if data exists (`/api/parts`)
2. Check export parameters
3. Check server memory

**Resolution:**
1. If no data: Upload and process data first
2. If memory: Reduce export size
3. If error: Check logs for details

---

## 9. Monitoring Checklist

### 9.1 Daily Checks

| Check | Command/Tool | Expected |
|-------|-------------|----------|
| Backend health | `curl <url>/` | `{"message":"Backend running"}` |
| API availability | `curl <url>/api/parts` | Array (may be empty) |
| HF Space status | Dashboard | Running |
| Disk usage | `df -h` | < 80% |

### 9.2 Weekly Checks

| Check | Action | Expected |
|-------|--------|----------|
| Upload directory cleanup | `ls backend/uploads/` | Minimal stale files |
| Data file size | `ls -lh backend/data/` | Reasonable size |
| Error logs review | Check HF Space logs | No recurring errors |
| Performance review | Check response times | < 2s per request |

### 9.3 Monthly Checks

| Check | Action |
|-------|--------|
| Dependency updates | Review requirements.txt for outdated packages |
| Security review | Check for vulnerabilities in dependencies |
| Documentation update | Update runbook with new procedures |
| Backup verification | Ensure data can be reprocessed from source |

### 9.4 Health Check Endpoints

```bash
# Basic health
curl https://your-space.hf.space/
# → {"message":"Backend running"}

# Data availability
curl https://your-space.hf.space/api/parts
# → ["SKU-001", "SKU-002", ...] or []

# Risk engine
curl https://your-space.hf.space/api/inventory-risk
# → [...] or []

# Forecast
curl https://your-space.hf.space/api/monthly-demand/ALL_PARTS
# → {"items": [...], "source": "GLOBAL_AGGREGATED", ...}
```

---

*End of Runbook*