from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import analytics, upload
import os

app = FastAPI(
    title="Inventory Intelligence API",
    description="API for demand forecasting, risk analysis, and inventory optimization.",
    version="1.0.0",
)

# Configure CORS
origins = [
    "http://localhost:5173",  # Local dev server
    os.environ.get("FRONTEND_URL") # Vercel deployment URL from env var
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Using wildcard for broad compatibility in this demo context. For production, use the `origins` list.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router, prefix="/api", tags=["Data Upload & Processing"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics & Forecasting"])