# Support Guide

**Inventory Intelligence Platform — Support Procedures**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Support Flow](#1-support-flow)
2. [Issue Classification](#2-issue-classification)
3. [Escalation Procedures](#3-escalation-procedures)
4. [Common Problems](#4-common-problems)
5. [Logs Inspection](#5-logs-inspection)
6. [Troubleshooting Steps](#6-troubleshooting-steps)
7. [User Support Scenarios](#7-user-support-scenarios)

---

## 1. Support Flow

```
User Reports Issue
        │
        ▼
┌─────────────────────┐
│  Level 1: Triage    │
│  - Classify issue   │
│  - Check known      │
│    issues database  │
│  - Basic diagnostics│
└─────────┬───────────┘
          │
    ┌─────┴─────┐
    │           │
  Resolved    Needs
              Escalation
    │           │
    │           ▼
    │  ┌─────────────────────┐
    │  │  Level 2: Technical │
    │  │  - Logs inspection  │
    │  │  - Code review      │
    │  │  - Environment check│
    │  └─────────┬───────────┘
    │            │
    │       ┌────┴─────┐
    │       │          │
    │    Resolved   Needs
    │              Development
    │       │          │
    │       │          ▼
    │       │  ┌─────────────────────┐
    │       │  │  Level 3: Dev Team  │
    │       │  │  - Bug fix          │
    │       │  │  - Feature patch    │
    │       │  │  - Hotfix deploy    │
    │       │  └─────────────────────┘
    │       │
    └───────┘
```

---

## 2. Issue Classification

### 2.1 Severity Levels

| Level | Label | Response SLA | Description |
|-------|-------|-------------|-------------|
| **P0** | 🔴 Critical | 15 minutes | System down, data loss, security breach |
| **P1** | 🟠 High | 1 hour | Major feature broken, no workaround |
| **P2** | 🟡 Medium | 4 hours | Feature broken, workaround available |
| **P3** | 🟢 Low | 24 hours | Cosmetic issue, enhancement request |

### 2.2 Issue Categories

| Category | Examples |
|----------|----------|
| **Upload** | File upload fails, processing errors, wrong sheet detection |
| **Forecast** | Incorrect forecasts, missing data, confidence issues |
| **Export** | Export fails, wrong format, missing columns |
| **Dashboard** | Charts not loading, KPI errors, slow rendering |
| **Performance** | Slow API responses, high memory usage, timeouts |
| **Deployment** | Build failures, startup errors, CORS issues |
| **Data** | Transformation errors, missing columns, wrong format |

---

## 3. Escalation Procedures

### 3.1 Level 1 → Level 2 Escalation

**Trigger:** Issue cannot be resolved with basic diagnostics

**Handoff Information:**
```
- User ID/Context
- Issue description
- Steps to reproduce
- Error messages (screenshots)
- Browser/OS info
- Timestamp of issue
```

### 3.2 Level 2 → Level 3 Escalation

**Trigger:** Bug identified in code, requires development fix

**Handoff Information:**
```
- All Level 1 info
- Log excerpts
- API request/response
- Network trace (if frontend)
- Code references
- Environment details
```

### 3.3 Escalation Contacts

| Level | Role | Contact Method |
|-------|------|----------------|
| Level 1 | Support Team | Support ticket system |
| Level 2 | Technical Support | Internal chat/email |
| Level 3 | Development Team | GitHub issue + Slack |

---

## 4. Common Problems

### 4.1 Upload Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| "Error uploading file" | File too large, disk full | Check file size (<50MB), clean uploads/ |
| "Invalid sheet" | Wrong sheet selected | Select sheet with "Part No" column |
| "Data transformation failed" | Wrong data format | Ensure wide or long format |
| Upload hangs | Network issue, large file | Refresh and retry with smaller file |

### 4.2 Forecast Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Empty forecast | No data processed | Upload and process data first |
| All forecasts are 0 | Inactive SKUs | Check data has non-zero demand |
| Low confidence scores | Sparse demand data | Expected for intermittent SKUs |
| Missing future months | Recent data upload | System needs historical data |

### 4.3 Export Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Export button does nothing | No data, or API error | Check data exists, check console |
| "No data available" | No processed data | Upload and process data |
| Export is very slow | Large number of parts | Select fewer parts, reduce horizon |
| XLSX export fails | Memory limit | Use CSV format instead |

### 4.4 Dashboard Issues

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| Charts not rendering | No data, or render error | Check data exists, refresh page |
| "Failed to connect" | Backend unreachable | Check backend status |
| KPI shows 0 | No processed data | Upload and process data |
| AI insights empty | No risk data | Process data with sufficient history |

---

## 5. Logs Inspection

### 5.1 Backend Logs

**Local Development:**
```bash
# Backend logs are printed to stdout
# Look for lines starting with timestamp:
# 2026-07-01 09:00:00 - app.api.upload - INFO - Upload received.
# 2026-07-01 09:00:01 - app.api.analytics - ERROR - ...

# To filter for errors:
uvicorn main:app 2>&1 | grep -i error
```

**HuggingFace Spaces:**
1. Go to Space dashboard
2. Click **Logs** tab
3. Filter by log level (Info, Warning, Error)
4. Search for specific error messages

### 5.2 Frontend Logs

**Browser Console:**
```javascript
// Open DevTools (F12) → Console tab
// Look for:
// - API request errors (red)
// - React warnings (yellow)
// - Custom log messages
```

**Network Tab:**
```javascript
// Open DevTools → Network tab
// Filter by "api" to see backend requests
// Check:
// - Request URL
// - Response status code
// - Response body
// - Request headers
```

### 5.3 Key Log Messages

| Log Message | Meaning | Action |
|-------------|---------|--------|
| `Upload received. Assigning file_id: ...` | File upload started | Normal operation |
| `File streaming complete. Size: ... bytes.` | File saved to disk | Normal operation |
| `Data transformation successful.` | Processing completed | Normal operation |
| `Error during file upload: ...` | Upload failed | Check file and disk |
| `File not found for file_id: ...` | Invalid file_id | Re-upload file |
| `Export limit of 50000 rows reached.` | Export truncated | Reduce export scope |
| `Could not calculate risk data for export` | Risk engine issue | Check data format |

---

## 6. Troubleshooting Steps

### 6.1 Initial Diagnostics

```bash
# 1. Check backend health
curl http://localhost:8000/

# 2. Check API availability
curl http://localhost:8000/api/parts

# 3. Check data exists
curl http://localhost:8000/api/inventory?limit=1

# 4. Check risk engine
curl http://localhost:8000/api/inventory-risk

# 5. Check forecast
curl http://localhost:8000/api/monthly-demand/ALL_PARTS
```

### 6.2 Data Flow Troubleshooting

```
User reports "No data on dashboard"
        │
        ▼
1. Check if data was uploaded
   ├── Yes → Go to step 2
   └── No → Guide user to upload data
        │
        ▼
2. Check if data was processed
   ├── Yes → Go to step 3
   └── No → Guide user to process sheet
        │
        ▼
3. Check API returns data
   ├── curl /api/parts → non-empty
   │   Yes → Frontend issue (refresh)
   │   No → Backend issue (check logs)
   └──
```

### 6.3 Common Fixes

| Issue | Quick Fix |
|-------|-----------|
| Page not loading | Hard refresh (Ctrl+Shift+R) |
| API errors | Restart backend |
| Stale data | Re-upload and process |
| Export fails | Use CSV, fewer parts |
| Slow performance | Reduce dataset size |

---

## 7. User Support Scenarios

### Scenario 1: "I can't upload my file"

**User says:** "I uploaded my Excel file but nothing happened"

**Support Response:**
1. "What type of file are you uploading? (.xlsx or .csv)"
2. "How large is the file? (in MB)"
3. "Do you see any error message on the screen?"
4. "Can you try refreshing the page and uploading again?"

**If still failing:**
- Ask user to check file is not corrupted
- Suggest saving as CSV and retrying
- Check if file has multiple sheets

### Scenario 2: "The forecast doesn't look right"

**User says:** "The forecast shows all zeros for my parts"

**Support Response:**
1. "Have you uploaded and processed your data?"
2. "Do your parts have non-zero demand history?"
3. "What does the confidence score show?"
4. "Can you check the SKU state for that part?"

**Explanation:**
- SKUs with zero demand are classified as INACTIVE
- Sparse SKUs may show low confidence
- Need at least 3 months of data for forecast

### Scenario 3: "Export is not working"

**User says:** "I clicked export but nothing downloaded"

**Support Response:**
1. "Which format are you trying? (CSV or Excel)"
2. "How many parts did you select?"
3. "What horizon did you choose?"
4. "Do you see any error in browser console (F12)?"

**Workarounds:**
- Try CSV instead of Excel
- Select fewer parts
- Reduce forecast horizon
- Check popup blocker isn't preventing download

### Scenario 4: "The dashboard is slow"

**User says:** "The dashboard takes too long to load"

**Support Response:**
1. "How large is your dataset? (rows and columns)"
2. "Which browser are you using?"
3. "Is the issue consistent or intermittent?"

**Solutions:**
- Reduce dataset size
- Use Chrome/Edge for best performance
- Clear browser cache
- Check internet connection

---

*End of Support Guide*