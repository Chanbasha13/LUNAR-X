import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.routes import router

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent
PREVIEWS_DIR = BASE_DIR / "data" / "previews"
RESULTS_DIR = BASE_DIR / "data" / "results"

PREVIEWS_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="LUNAR-X Planetary Data Engine",
    description="Backend ingestion and processing engine for Chandrayaan-2 PDS4 products (OHRC, TMC-2, IIRS).",
    version="0.1.0",
)

# Environment-configurable CORS middleware
allowed_origins_raw = os.getenv(
    "BACKEND_ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000",
)

if allowed_origins_raw.strip() == "*":
    allowed_origins = ["*"]
else:
    allowed_origins = [orig.strip() for orig in allowed_origins_raw.split(",") if orig.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve generated previews and correspondence results statically
app.mount("/static/previews", StaticFiles(directory=str(PREVIEWS_DIR)), name="previews")
app.mount("/static/results", StaticFiles(directory=str(RESULTS_DIR)), name="results")

# Include API routes
app.include_router(router)


@app.get("/")
async def root():
    return {
        "message": "LUNAR-X Planetary Data API is online.",
        "docs": "/docs",
        "health": "/health",
        "api_health": "/api/health",
    }


@app.get("/health")
async def health_check_root():
    return {
        "status": "ok",
        "service": "LUNAR-X Planetary Data Engine",
        "version": "0.1.0",
    }
