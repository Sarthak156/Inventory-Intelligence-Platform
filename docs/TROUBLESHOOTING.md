# Troubleshooting Guide

**Inventory Intelligence Platform — Common Issues & Solutions**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Deployment Failures](#1-deployment-failures)
2. [Docker Issues](#2-docker-issues)
3. [HF Space Startup Problems](#3-hf-space-startup-problems)
4. [Vite Cache Problems](#4-vite-cache-problems)
5. [React Runtime Issues](#5-react-runtime-issues)
6. [Upload Hangs](#6-upload-hangs)
7. [Export Crashes](#7-export-crashes)
8. [Chart Rendering Issues](#8-chart-rendering-issues)
9. [CORS Errors](#9-cors-errors)
10. [Data Processing Errors](#10-data-processing-errors)

---

## 1. Deployment Failures

### 1.1 Vercel Build Fails

**Symptoms:**
- Vercel deployment shows "Build Failed"
- Error in build logs

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Missing `vercel.json` | Add configuration with SPA rewrites |
| Wrong Node.js version | Set Node.js 18+ in Vercel project settings |
| Missing dependencies | Run `npm install` locally to verify, check `package-lock.json` is committed |
| Build command error | Verify `npm run build` works locally first |
| Environment variable missing | Add `VITE_API_BASE_URL` in Vercel dashboard |

**Fix Steps:**
```bash
# 1. Test build locally
cd frontend
npm run build

# 2. Check build output
ls dist/

# 3. If build succeeds locally but fails on Vercel:
# - Check Vercel logs for specific error
# - Ensure all dependencies are in package.json
# - Try clearing Vercel build cache
```

### 1.2 HuggingFace Space Build Fails

**Symptoms:**
- Space shows "Building" indefinitely
- Build logs show errors

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Dockerfile syntax error | Verify Dockerfile with `docker build` locally |
| Missing requirements | Ensure `requirements.txt` lists all dependencies |
| Out of disk space | Reduce dataset size, clean up files |
| Invalid port | Ensure Dockerfile exposes 7860 |
| Python version mismatch | Use `python:3.11-slim` base image |

**Fix Steps:**
```bash
# 1. Test Docker build locally
cd backend
docker build -t test-backend .

# 2. Run and test
docker run -p 7860:7860 test-backend
curl http://localhost:7860/

# 3. If local build works but HF fails:
# - Check HF Space builder logs
# - Verify all files are pushed to HF git repo
# - Try Factory Restart from Space settings
```

---

## 2. Docker Issues

### 2.1 Container Won't Start

**Symptoms:**
- `docker run` exits immediately
- Container status is "Exited"

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Port already in use | Change host port mapping |
| Missing dependencies | Rebuild with `--no-cache` |
| Volume permission error | Check directory permissions |
| Entrypoint script error | Verify CMD syntax in Dockerfile |

**Fix Steps:**
```bash
# Check container logs
docker logs <container-id>

# Remove and recreate
docker rm <container-id>
docker run -p 8000:7860 inventory-backend

# Check if port is in use
netstat -ano | findstr :8000
```

### 2.2 Docker Compose Issues

**Symptoms:**
- `docker-compose up` fails
- Services can't communicate

**Fix Steps:**
```bash
# Rebuild all images
docker-compose build --no-cache

# Start with verbose output
docker-compose up --build

# Check service logs
docker-compose logs backend
docker-compose logs frontend

# Ensure network is created
docker network ls
```

---

## 3. HF Space Startup Problems

### 3.1 Cold Start Timeout

**Symptoms:**
- First request takes 30-60 seconds
- Request times out on first load
- Subsequent requests are fast

**Root Cause:** HuggingFace Spaces free tier spins down after inactivity. Cold start requires Docker image to load.

**Solutions:**
```bash
# 1. Keep-alive ping (cron job)
curl https://your-space.hf.space/ every 30 minutes

# 2. Use HF Pro for always-on instances
# Upgrade in Space Settings → Hardware

# 3. Implement retry logic on frontend
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url, { timeout: 60000 });
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 5000 * (i + 1)));
    }
  }
}
```

### 3.2 Out of Memory on HF

**Symptoms:**
- Space shows "Out of Memory" status
- API returns 500 errors
- Space restarts automatically

**Root Cause:** Large dataset exceeds HF Space free tier memory (8GB).

**Solutions:**
1. Reduce dataset size (< 10MB per file)
2. Remove unused columns before upload
3. Use CSV instead of XLSX for exports
4. Upgrade to HF Pro (16GB RAM)
5. Clear `uploads/` directory regularly

---

## 4. Vite Cache Problems

### 4.1 Stale Build Cache

**Symptoms:**
- Changes not reflecting after rebuild
- Old code running after changes
- "Module not found" errors

**Fix Steps:**
```bash
# Clear Vite cache
cd frontend
rm -rf node_modules/.vite

# Clear npm cache
npm cache clean --force

# Clear build output
rm -rf dist

# Reinstall and rebuild
npm install
npm run build
```

### 4.2 Hot Module Replacement Issues

**Symptoms:**
- Changes not hot-reloading
- Full page refresh needed

**Fix Steps:**
```bash
# Restart dev server
# Ctrl+C to stop, then:
npm run dev

# If still issues, clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

---

## 5. React Runtime Issues

### 5.1 "Cannot read properties of undefined"

**Symptoms:**
- Component crashes on render
- Error in console: "Cannot read properties of undefined (reading 'map')"

**Root Cause:** Component tries to iterate over undefined/null data.

**Fix:**
```jsx
// Before (unsafe)
{data.map(item => ...)}

// After (safe)
{(data || []).map(item => ...)}

// Or with optional chaining
{data?.map(item => ...)}
```

### 5.2 Infinite Re-render Loop

**Symptoms:**
- Component re-renders infinitely
- Browser becomes unresponsive
- "Too many re-renders" error

**Root Cause:** State update in render without proper dependencies.

**Fix:**
```jsx
// Wrong: causes infinite loop
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1); // ← This triggers re-render, which triggers setCount again
  return <div>{count}</div>;
}

// Correct: use useEffect
function Component() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(prev => prev + 1);
  }, []); // Empty dependency array = runs once
  return <div>{count}</div>;
}
```

### 5.3 Stale Props in Callbacks

**Symptoms:**
- Callback uses old state/props values
- Closure captures outdated variables

**Fix:**
```jsx
// Wrong: stale closure
const handleClick = () => {
  console.log(count); // count might be stale
};

// Correct: use functional update
const handleClick = () => {
  setCount(prev => prev + 1);
};

// Or use useRef for latest value
const countRef = useRef(count);
countRef.current = count;
```

---

## 6. Upload Hangs

### 6.1 File Upload Never Completes

**Symptoms:**
- Upload progress bar stuck
- No error message
- Network tab shows pending request

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| File too large | Reduce file size (< 50MB) |
| Network issue | Check internet connection |
| Backend not running | Verify backend is accessible |
| Disk full | Clean up uploads/ directory |
| Browser timeout | Split into smaller files |

**Debug Steps:**
```bash
# 1. Check backend is running
curl http://localhost:8000/

# 2. Check disk space
df -h

# 3. Check uploads directory
ls -la backend/uploads/

# 4. Try with a small test file first
```

### 6.2 Process Sheet Stalls

**Symptoms:**
- "Processing..." message never completes
- No response from API

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Large dataset transformation | Wait longer, use smaller file |
| Memory exhaustion | Use smaller file, restart backend |
| Invalid data format | Check file format requirements |
| Excel with many sheets | Select correct sheet first |

**Fix Steps:**
```bash
# 1. Check backend logs for errors
# 2. Verify file is valid Excel/CSV
# 3. Try CSV instead of Excel
# 4. Restart backend and retry
```

---

## 7. Export Crashes

### 7.1 Export Returns 500 Error

**Symptoms:**
- Export button triggers error
- "No data available" message

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| No data processed | Upload and process data first |
| Memory limit exceeded | Reduce export scope, use CSV |
| Invalid parameters | Check parts list, horizon, format |
| Backend timeout | Export fewer parts, shorter horizon |

**Debug Steps:**
```bash
# 1. Check data exists
curl http://localhost:8000/api/parts

# 2. Test with minimal export
curl -X POST http://localhost:8000/api/export-forecast \
  -H "Content-Type: application/json" \
  -d '{"parts": ["SKU-001"], "horizon": 3, "format": "csv"}'

# 3. Check backend logs for error details
```

### 7.2 Export Hangs Mid-Stream

**Symptoms:**
- Download starts but never completes
- Partial file downloaded

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Large export (>50K rows) | Reduce scope |
| Memory exhaustion | Use CSV format |
| Backend crash during processing | Check logs, reduce scope |

---

## 8. Chart Rendering Issues

### 8.1 Charts Not Displaying

**Symptoms:**
- Empty space where chart should be
- Console warnings about width/height

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Container has no height | Set explicit height on chart container |
| Data is empty/undefined | Check data exists before rendering |
| Recharts container warning | Add `min-width: 0` to parent |
| SVG rendering error | Wrap in `ResponsiveContainer` |

**Fix:**
```jsx
// Wrong: no height specified
<div>
  <ResponsiveContainer>
    <LineChart data={data}>...</LineChart>
  </ResponsiveContainer>
</div>

// Correct: explicit height
<div style={{ width: '100%', height: 300 }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>...</LineChart>
  </ResponsiveContainer>
</div>

// Additional CSS fix
.min-w-0 { min-width: 0; }
```

### 8.2 Charts Rendering Slowly

**Symptoms:**
- Chart animation is janky
- Hover tooltip is slow
- Page lags when chart updates

**Solutions:**
```jsx
// 1. Memoize chart data
const chartData = useMemo(() => expensiveTransformation(data), [data]);

// 2. Memoize chart component
const MemoizedChart = React.memo(ChartComponent);

// 3. Reduce data points
const downsampledData = useMemo(() => 
  data.filter((_, i) => i % 2 === 0), [data]
);
```

---

## 9. CORS Errors

**Symptoms:**
- Browser console: "CORS policy: No 'Access-Control-Allow-Origin'"
- API requests blocked

**Root Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Backend CORS not configured | Add CORS middleware in main.py |
| Wrong origin in CORS config | Match exact frontend URL |
| Development vs production mismatch | Use wildcard or env var |

**Fix:**
```python
# backend/main.py
from fastapi.middleware.cors import CORSMiddleware
import os

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        os.environ.get("FRONTEND_URL", ""),
        "*"  # Development only
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 10. Data Processing Errors

### 10.1 "Missing required Part No column"

**Symptoms:**
- Sheet processing fails with this error
- 400 Bad Request response

**Solutions:**
1. Check that your sheet has a column named "Part No", "Part Number", "SKU", "Item", or "Material"
2. Ensure the column name has no extra spaces or special characters
3. Try a different sheet in the file
4. Rename the column to "Part No" and retry

### 10.2 "Data transformation failed"

**Symptoms:**
- Process-sheet returns 400 with this error
- Data structure not recognized

**Solutions:**
1. Ensure data is in wide format (month columns) or long format (Month + Demand columns)
2. Verify month columns are parseable as dates (e.g., "Jan-2024", "2024-01")
3. Check that demand values are numeric
4. Remove any summary rows or merged cells
5. Save file as CSV and retry

### 10.3 Empty forecast or risk data

**Symptoms:**
- Dashboard shows all zeros
- Risk engine returns empty array

**Solutions:**
1. Verify data was processed successfully (check /api/parts returns data)
2. Ensure dataset has non-zero demand values
3. Check that Month column is properly formatted
4. Re-upload and process the file

---

*End of Troubleshooting Guide*