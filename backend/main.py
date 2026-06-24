import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, analytics
import os

# Ensure necessary directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("data", exist_ok=True)

app = FastAPI(
    title="Inventory Intelligence API",
    description="API for the Inventory Intelligence Platform.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "running"}

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])