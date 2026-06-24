import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, analytics
import os

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

app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(analytics.router, prefix="/api", tags=["Analytics"])