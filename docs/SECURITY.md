# Security Guide

**Inventory Intelligence Platform — Security Architecture & Best Practices**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Upload Validation](#1-upload-validation)
2. [API Security](#2-api-security)
3. [Environment Variable Handling](#3-environment-variable-handling)
4. [CORS Policy](#4-cors-policy)
5. [Deployment Security](#5-deployment-security)
6. [Frontend Safety](#6-frontend-safety)
7. [Backend Protection](#7-backend-protection)

---

## 1. Upload Validation

### 1.1 File Type Validation

The system accepts only CSV (.csv) and Excel (.xlsx) files. File type is determined by extension:

```python
file_extension = ".csv" if file.filename.endswith(".csv") else ".xlsx"
```

**Limitations:**
- File extension is not validated against actual content
- No MIME type checking
- No file size limit enforcement in code

**Recommendations:**
```python
# Add MIME type validation
ALLOWED_MIME_TYPES = {
    '.csv': 'text/csv',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
}

# Add file size limit
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

if file.content_type not in ALLOWED_MIME_TYPES.values():
    raise HTTPException(400, "Invalid file type")
```

### 1.2 Data Sanitization

```python
# Column name sanitization
df.columns = [str(col).strip() for col in df.columns]

# Demand value sanitization
df["Demand"] = pd.to_numeric(df["Demand"], errors="coerce")
df["Demand"] = df["Demand"].replace([np.inf, -np.inf], np.nan).fillna(0)
```

### 1.3 File Storage

- Uploaded files are stored with UUID-based names (prevents path traversal)
- Files are stored in a dedicated `uploads/` directory
- No direct file access from outside the application

---

## 2. API Security

### 2.1 Current State

| Security Measure | Status | Notes |
|-----------------|--------|-------|
| Authentication | ❌ Not implemented | No login required |
| Authorization | ❌ Not implemented | No role-based access |
| Rate Limiting | ❌ Not implemented | No request throttling |
| Input Validation | ✅ Partial | Pydantic models for some endpoints |
| HTTPS | ✅ Production | Vercel + HF Spaces provide HTTPS |
| API Keys | ❌ Not implemented | No API key required |

### 2.2 Input Validation

The system uses Pydantic models for request validation:

```python
class ProcessSheetRequest(BaseModel):
    file_id: str
    sheet_name: str
```

**Validation applied:**
- Type coercion (Pydantic auto-converts types)
- Required field checking
- Structured error responses

**Missing validation:**
- String length limits
- Pattern validation (regex)
- Allowed values enumeration

### 2.3 Error Handling

```python
# Safe error handling (no stack trace leakage)
try:
    result = process_data(df)
    return result
except Exception as e:
    logger.error(f"Error: {e}", exc_info=True)  # Logged internally
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred."}  # Safe message
    )
```

---

## 3. Environment Variable Handling

### 3.1 Current Configuration

```env
# Backend
FRONTEND_URL=http://localhost:5173

# Frontend
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### 3.2 Best Practices

```env
# NEVER commit .env files to version control
# .gitignore should include:
.env
.env.local
.env.production

# Use .env.example as a template (committed to repo)
# Store actual values in:
# - Local: .env file (gitignored)
# - Vercel: Environment Variables in dashboard
# - HF Spaces: Repository Secrets in settings
```

### 3.3 Secret Management

| Secret | Storage Location | Access |
|--------|-----------------|--------|
| API Keys | Environment variables | Application runtime only |
| Database URLs | Environment variables | Application runtime only |
| JWT Secrets | Environment variables | Application runtime only |
| Gemini API Key | Environment variables | AI insight service |

---

## 4. CORS Policy

### 4.1 Current Configuration

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Wildcard for broad compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4.2 Security Implications

| Setting | Risk | Recommendation |
|---------|------|----------------|
| `allow_origins=["*"]` | Any website can make API calls | Restrict to specific origins in production |
| `allow_credentials=True` | Credentials can be sent cross-origin | Only needed with auth cookies |
| `allow_methods=["*"]` | All HTTP methods allowed | Restrict to needed methods (GET, POST) |
| `allow_headers=["*"]` | All headers allowed | Restrict to needed headers |

### 4.3 Production Configuration

```python
# Production CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-frontend.vercel.app",
        "https://your-custom-domain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)
```

---

## 5. Deployment Security

### 5.1 Vercel Security

| Feature | Status | Notes |
|---------|--------|-------|
| HTTPS | ✅ Enabled by default | Automatic SSL/TLS |
| DDoS Protection | ✅ Included | Vercel Edge Network |
| Environment Encryption | ✅ Included | Encrypted at rest |
| Automatic Deployments | ⚠️ Configure per branch | Use production branch protection |

### 5.2 HuggingFace Spaces Security

| Feature | Status | Notes |
|---------|--------|-------|
| HTTPS | ✅ Enabled by default | Automatic SSL/TLS |
| Secrets Management | ✅ Repository Secrets | Encrypted environment variables |
| Container Isolation | ✅ Docker containers | Isolated from other Spaces |
| Network Isolation | ✅ Internal network | No public access to internal ports |

### 5.3 Docker Security

```dockerfile
# Security best practices for Dockerfile
FROM python:3.11-slim

# Run as non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Don't run as root
WORKDIR /app

# Copy only necessary files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY --chown=appuser:appuser . .

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

---

## 6. Frontend Safety

### 6.1 XSS Prevention

- React's JSX automatically escapes output (prevents XSS)
- No `dangerouslySetInnerHTML` usage
- All user data rendered as text, not HTML

### 6.2 API Key Exposure

```javascript
// NEVER hardcode API keys in frontend code
// WRONG:
const API_KEY = "sk-1234567890abcdef";

// CORRECT: Use environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
```

### 6.3 Sensitive Data Display

- Part numbers and demand data are business data, not PII
- No personal user information stored or displayed
- No authentication tokens stored in localStorage

---

## 7. Backend Protection

### 7.1 Input Injection Prevention

```python
# Pandas type coercion prevents injection
df["Demand"] = pd.to_numeric(df["Demand"], errors="coerce")

# Column name sanitization
df.columns = [str(col).strip() for col in df.columns]

# No raw SQL queries (no database used)
```

### 7.2 File System Protection

```python
# UUID-based filenames prevent path traversal
file_id = str(uuid.uuid4())
file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")

# File cleanup on error
if os.path.exists(file_path):
    os.remove(file_path)
```

### 7.3 Logging Security

```python
# Log messages should NOT contain:
# - API keys
# - Passwords
# - Personal data
# - Full stack traces in production

# Safe logging
logger.info(f"Processing request for file_id: {file_id}")

# Unsafe logging (AVOID)
logger.info(f"Full request data: {request.json()}")
```

---

## Security Checklist

| Check | Status | Priority |
|-------|--------|----------|
| HTTPS enabled | ✅ | High |
| CORS restricted in production | ⚠️ (uses wildcard) | High |
| Input validation | ✅ Partial | High |
| File upload validation | ⚠️ (extension only) | High |
| Authentication | ❌ | High |
| Rate limiting | ❌ | Medium |
| SQL injection prevention | ✅ (no database) | Medium |
| XSS prevention | ✅ (React auto-escape) | Medium |
| Environment secrets management | ✅ | Medium |
| Non-root container user | ❌ | Low |
| API key rotation | ❌ | Low |
| Security headers (CSP, HSTS) | ❌ | Low |

---

*End of Security Guide*