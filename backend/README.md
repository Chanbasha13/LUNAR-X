# LUNAR-X Backend: Planetary Data & Ingestion Engine (SIH26166)

Backend service for **LUNAR-X** — Multi-modal, Sun angle, and scale-invariant image correspondence using Chandrayaan-2 optical instruments (OHRC, TMC-2, IIRS).

---

## Key Features

1. **PDS4 XML Metadata Inspector**:
   - Parses ISRO/ISDA PDS4 XML labels (`Product_Observational`).
   - Extracts instrument metadata (OHRC), orbit numbers, solar incidence, geometry bounds, and raster organization.
   - Validates that raw raster byte size matches XML specifications before processing.

2. **Memory-Safe Scientific Image Loader**:
   - Uses `numpy.memmap` strictly in **read-only mode (`mode='r'`)**.
   - Handles multi-gigabyte scientific `.img` files (e.g. 1.03 GB, 91,971 × 12,000 pixels) without memory exhaustion.
   - Preserves raw scientific data with zero modification.

3. **Non-Destructive Web Preview Generation**:
   - Generates aspect-ratio preserved, contrast-stretched PNG previews for frontend visualization.
   - Previews saved to `backend/data/previews/` and served at `/static/previews/`.

4. **Strict Provenance & Status Tracking**:
   - All endpoints return provenance: `[COMPUTED]`, `[REFERENCE]`, or `[AWAITING ANALYSIS]`.
   - Zero fabricated metrics.

---

## Directory Structure

```
backend/
├── app/
│   ├── main.py                     # FastAPI application & static mount
│   ├── api/
│   │   └── routes.py               # API route handlers
│   ├── services/
│   │   ├── pds4_reader.py          # XML parser & file size validation
│   │   ├── image_loader.py         # Memory-mapped raster access
│   │   ├── preprocessing.py        # Non-destructive preview generator
│   │   └── correspondence_engine.py # Algorithm interfaces
│   └── models/
│       └── schemas.py              # Pydantic schemas with status fields
├── data/
│   ├── raw/                        # Raw PDS4 storage (if cached)
│   ├── processed/                  # Intermediate processed data
│   └── previews/                   # Generated PNG web previews
├── tests/
│   └── test_ingestion.py           # Ingestion & validation test suite
├── requirements.txt
└── README.md
```

---

## API Endpoints

- `GET /api/health`: Health status.
- `POST /api/pds4/inspect`: Inspects PDS4 XML and validates linked `.img` raster.
- `POST /api/data/preview`: Generates a web-ready preview from raw `.img`.
- `POST /api/correspondence/analyze`: Correspondence evaluation endpoint (`[AWAITING ANALYSIS]`).

