# LUNAR-X (SIH26166) — Production Deployment & Execution Guide

This document provides complete, step-by-step instructions for deploying and running the **LUNAR-X Planetary Image Analysis & Co-Registration Platform** in both local development and production environments.

---

## 1. System Architecture Overview

```text
┌─────────────────────────────────────────────────────────┐
│              Next.js 16 Production Frontend             │
│        (React 19 · Three.js · Framer Motion · R3F)       │
│               Port: 3000 (or custom domain)             │
└───────────────────────────▲─────────────────────────────┘
                            │
               HTTP / JSON (FormData POST)
                            │
┌───────────────────────────▼─────────────────────────────┐
│               FastAPI High-Performance API              │
│       (Python 3.13 · PyTorch · OpenCV · NumPy · LoFTR)   │
│                        Port: 8000                       │
└───────────────────────────▲─────────────────────────────┘
                            │
             Direct Memory-Mapping (np.memmap)
                            │
┌───────────────────────────▼─────────────────────────────┐
│          ISRO Chandrayaan-2 PDS4 Data Archives          │
│       (1.03 GB OHRC Raster + TMC-2 Raster + XML Grids)  │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS)
- **Python**: `3.10+` (Python 3.11, 3.12, or 3.13 recommended)
- **PyTorch**: Compatible with CPU, Apple Silicon (MPS), or NVIDIA (CUDA)
- **Git**: For version control

---

## 3. Local Development Setup

### Step A: Configure Environment Variables

1. In the project root or `lunar-x-app/`, copy `.env.example` to `.env.local`:
   ```bash
   cp lunar-x-app/.env.example lunar-x-app/.env.local
   ```
2. For local execution, ensure:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
   ```

3. For the backend:
   ```bash
   cp backend/.env.example backend/.env
   ```
   ```env
   BACKEND_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000
   ```

---

### Step B: Start Backend Service

```bash
# 1. Navigate to project root
cd /path/to/LUNAR-X

# 2. Activate virtual environment
source /Volumes/Ali/lunar_venv/bin/activate   # or your local venv: source venv/bin/activate

# 3. Start FastAPI with Uvicorn
PYTHONPATH="$PWD/backend" uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Verify backend health:
```bash
curl http://127.0.0.1:8000/health
# Response: {"status":"ok","service":"LUNAR-X Planetary Data Engine","version":"0.1.0"}
```

---

### Step C: Start Frontend Service

```bash
# 1. Navigate to frontend directory
cd lunar-x-app

# 2. Install dependencies (if not already installed)
npm install

# 3. Start Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Production Build & Deployment

### Step A: Build Next.js Frontend for Production

```bash
cd lunar-x-app

# Run production build with TypeScript & Turbopack verification
npm run build
```

### Step B: Start Next.js Production Server

```bash
cd lunar-x-app
npm run start -p 3000
```

---

### Step C: Deploy Backend on Production Server (Linux VPS / Cloud Container)

To run the FastAPI backend reliably in production, use Uvicorn with multiple workers or Gunicorn:

```bash
# Install Gunicorn and Uvicorn workers
pip install gunicorn uvicorn[standard]

# Run production server with 4 worker processes
PYTHONPATH="$PWD/backend" gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.app.main:app --bind 0.0.0.0:8000
```

### Step D: Set Production Environment & CORS

When frontend and backend are hosted on separate domains:

1. **Frontend (`lunar-x-app/.env.production`)**:
   ```env
   NEXT_PUBLIC_API_BASE_URL=https://api.lunar-x.yourdomain.com
   ```
2. **Backend (`backend/.env` or system environment)**:
   ```env
   BACKEND_ALLOWED_ORIGINS=https://lunar-x.yourdomain.com,https://www.yourdomain.com
   ```

---

## 5. Live Scientific Analysis Verification

1. Open the application at `http://localhost:3000` (or your production URL).
2. Click **"ENTER MISSION CONTROL"**.
3. Click the top-right **"SCIENTIFIC ANALYSIS"** button.
4. Click **"Load Authentic ISRO Pair"** (auto-attaches authentic OHRC and TMC-2 chips).
5. Click **"Verify Co-registration & Compute Geodetic Location"**.
6. Observe live computed metrics:
   - **Dense Correspondences**: ~61 points (Raw) / 115 points (Scale-Matched)
   - **RANSAC Inliers**: 7 inliers (Raw) / 13 inliers (Scale-Matched)
   - **RANSAC Inlier Ratio**: 11.5% (Never labeled "accuracy")
   - **Sub-pixel RMSE**: 0.9486 px (Native TMC-2 domain)
   - **Selenographic Coordinates**: $7.4316^\circ\text{ N}, 301.2859^\circ\text{ E}$

---

## 6. Running Automated Tests

Run all 37 backend verification and registration tests:

```bash
PYTHONPATH="$PWD/backend" pytest backend/tests/ -v
```

Expected output:
```text
======================= 37 passed in 45s =======================
```

---

## 7. Security & Scientific Data Protection

- **No Secrets in Frontend**: `NEXT_PUBLIC_` variables contain only the public backend URL.
- **Large Rasters Protected**: Raw 1.03 GB `.img` binaries remain strictly server-side; only small 8-bit visual chips are transmitted to the browser.
- **Frozen Benchmarks**: Phase 8/9/10/11 benchmark records in `backend/data/results/final_benchmark/` remain read-only and frozen.
