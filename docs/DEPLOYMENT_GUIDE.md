# Deployment Guide

**Inventory Intelligence Platform — Deployment & Operations**

**Version:** 1.0.0  
**Last Updated:** July 2026

---

## Table of Contents

1. [Local Development Setup](#1-local-development-setup)
2. [Frontend Deployment (Vercel)](#2-frontend-deployment-vercel)
3. [Backend Deployment (HuggingFace Spaces)](#3-backend-deployment-huggingface-spaces)
4. [Environment Variables](#4-environment-variables)
5. [Docker Setup](#5-docker-setup)
6. [Production Build](#6-production-build)
7. [Troubleshooting Deployment Issues](#7-troubleshooting-deployment-issues)

---

## 1. Local Development Setup

### Prerequisites

- **Node.js** v18.0.0 or higher
- **Python** 3.11 or higher
- **Git**
- **npm** or **pnpm** (recommended)

### Step 1: Clone Repository

```bash
git clone https://github.com/Sarthak156/Inventory-Intelligence-Platform.git
cd inventory-intelligence-platform
```

### Step 2: Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verify backend:**
```bash
curl http://localhost:8000/
# Response: {"message":"Backend running"}
```

**View API docs:**
Open http://localhost:8000/docs in your browser.

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server with HMR
npm run dev
```

**Verify frontend:**
Open http://localhost:5173 in your browser. The Vite dev server proxies `/api` requests to the backend automatically.

### Step 4: Verify End-to-End

```bash
# Frontend should load without errors
# API proxy should forward to backend
curl http://localhost:5173/api/parts
```

---

## 2. Frontend Deployment (Vercel)

### Prerequisites

- Vercel account (vercel.com)
- Git repository connected to Vercel

### Method 1: Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to frontend directory
cd frontend

# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

### Method 2: Git Integration (Vercel Dashboard)

1. Go to [vercel.com](https://vercel.com)
2. Click **Add New → Project**
3. Import your Git repository
4. Configure project:
   - **Framework Preset:** Vite
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

5. Add environment variable:
   - `VITE_API_BASE_URL`: Your HuggingFace Space URL (e.g., `https://your-space.hf.space`)

6. Click **Deploy**

### Vercel Configuration (vercel.json)

If you need a custom configuration, create `vercel.json` in the frontend root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Post-Deployment

- **Verify:** Navigate to your Vercel deployment URL
- **API Connection:** Ensure `VITE_API_BASE_URL` points to the correct HuggingFace Space
- **Custom Domain:** Configure in Vercel Dashboard → Domains

---

## 3. Backend Deployment (HuggingFace Spaces)

### Prerequisites

- HuggingFace account (huggingface.co)
- Git LFS installed (for large files)

### Step 1: Create Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click **Create new Space**
3. Configure:
   - **Space Name:** `inventory-intelligence-api`
   - **License:** MIT
   - **SDK:** Docker
   - **Space Hardware:** CPU basic (free tier sufficient)

### Step 2: Configure Dockerfile

The existing `backend/Dockerfile` should look like:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 7860

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Step 3: Deploy via Git

```bash
# Clone your HF Space
git clone https://huggingface.co/spaces/your-username/inventory-intelligence-api
cd inventory-intelligence-api

# Copy backend files (excluding node_modules, venv, etc.)
cp -r /path/to/backend/* .
cp /path/to/backend/.env.example .env

# Add, commit, and push
git add .
git commit -m "Initial deployment"
git push
```

### Step 4: Configure Environment Variables

In HuggingFace Space Settings → **Repository Secrets**:

| Variable | Value | Description |
|----------|-------|-------------|
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Frontend URL for CORS |

### Step 5: Restart Space

- After push, Space automatically builds and starts
- Monitor build logs in **Builder** tab
- Check runtime logs in **Logs** tab

### Verify Deployment

```bash
curl https://your-username-inventory-intelligence-api.hf.space/
# Response: {"message":"Backend running"}
```

---

## 4. Environment Variables

### Backend (.env)

```env
# File: backend/.env

# Frontend URL for CORS configuration
FRONTEND_URL=http://localhost:5173
```

### Backend Production (.env)

```env
# File: backend/.env (Production)

# Frontend URL for CORS configuration
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env)

```env
# File: frontend/.env

# API Base URL (leave empty to use Vite proxy in development)
VITE_API_BASE_URL=http://127.0.0.1:8000
```

### Frontend Production (.env)

```env
# File: frontend/.env (Production)

# API Base URL for production (your HuggingFace Space)
VITE_API_BASE_URL=https://your-username-inventory-intelligence-api.hf.space
```

### Environment Variable Reference

| Variable | Required | Default | Component | Purpose |
|----------|----------|---------|-----------|---------|
| `FRONTEND_URL` | No | `http://localhost:5173` | Backend | CORS allowed origin |
| `VITE_API_BASE_URL` | No | `http://127.0.0.1:8000` | Frontend | Backend API endpoint |

---

## 5. Docker Setup

### Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create required directories
RUN mkdir -p uploads data

# Expose HuggingFace default port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:7860/ || exit 1

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
```

### Docker Compose (Local)

```yaml
# docker-compose.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:7860"
    volumes:
      - ./backend/data:/app/data
      - ./backend/uploads:/app/uploads
    environment:
      - FRONTEND_URL=http://localhost:5173
    restart: unless-stopped

  frontend:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - ./frontend:/app
    ports:
      - "5173:5173"
    command: sh -c "npm install && npm run dev"
    depends_on:
      - backend
    restart: unless-stopped
```

### Docker Commands

```bash
# Build and run
docker-compose up --build

# Run backend only
docker build -t inventory-backend ./backend
docker run -p 8000:7860 -v backend_data:/app/data inventory-backend

# Stop containers
docker-compose down

# View logs
docker-compose logs -f backend
```

---

## 6. Production Build

### Frontend Production Build

```bash
cd frontend

# Create production build
npm run build

# Preview production build locally
npm run preview

# The build output is in the dist/ directory
# Deploy dist/ to Vercel or any static hosting
```

### Build Output Structure

```
frontend/dist/
├── index.html
├── favicon.svg
├── icons.svg
└── assets/
    ├── index-Bh2ufN4B.js     # Main JS bundle
    ├── index-DAp5DHb5.css    # Compiled CSS
    └── [hash].[ext]          # Other assets
```

### Backend Production Considerations

```bash
# For production, use multiple uvicorn workers
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Or use gunicorn with uvicorn workers
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

---

## 7. Troubleshooting Deployment Issues

### Frontend Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Blank page after deploy** | Build error or routing issue | Check vercel build logs. Ensure rewrites to index.html |
| **API calls failing** | Wrong API URL | Verify `VITE_API_BASE_URL` is set correctly |
| **CORS errors in browser** | Backend CORS not configured | Allow frontend origin in backend CORS |
| **404 on page refresh** | No SPA fallback | Add vercel.json rewrites config |

### Backend Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| **Space fails to build** | Dockerfile error or dependency issue | Check HF Space builder logs |
| **Module not found** | Missing dependencies | Verify requirements.txt is complete |
| **Port binding failed** | Wrong port in CMD | Use port 7860 for HF Spaces |
| **Out of memory** | Large CSV files | Optimize data size, increase HF Space hardware |
| **Cold start timeout** | HF Space cold start | HF Spaces sleep after inactivity. Use HF Pro for always-on. |

### API Connectivity Issues

```bash
# Test backend health
curl https://your-space.hf.space/
# Should return: {"message":"Backend running"}

# Test API endpoint
curl https://your-space.hf.space/api/parts
# Should return array (empty if no data)

# Test CORS headers
curl -I -X OPTIONS https://your-space.hf.space/api/parts \
  -H "Origin: https://your-frontend.vercel.app"
# Should include Access-Control-Allow-Origin header
```

### Common Docker Issues

| Issue | Solution |
|-------|----------|
| **Build fails with gcc error** | Install build-essential in Dockerfile |
| **Volume permissions** | Ensure user permissions for uploads/ and data/ |
| **Port already in use** | Change host port mapping |
| **Container exits immediately** | Check Docker logs, verify CMD syntax |

---

*End of Deployment Guide*