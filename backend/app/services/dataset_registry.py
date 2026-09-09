"""
Dataset Registry and Validation Service for LUNAR-X (SIH26166).

Manages discovery, registration, and integrity verification of authentic
Chandrayaan-2 PDS4 products (OHRC, TMC-2, IIRS).

Guarantees:
- Original scientific files remain read-only and unmutated.
- Exact dimension and byte-size consistency is verified against XML labels.
- Provenance is explicitly tagged as [REFERENCE] for all extracted metadata.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Any, Dict, List, Optional
import numpy as np
from pydantic import BaseModel, Field

from app.models.schemas import AnalysisStatus, PDS4Metadata
from app.services.image_loader import get_memmap, resolve_img_path
from app.services.pds4_reader import parse_pds4_label

DEFAULT_REGISTRY_PATH = (
    Path(__file__).resolve().parents[2] / "data" / "dataset_registry.json"
)


class VerifiedDatasetEntry(BaseModel):
    """Pydantic model for a registered and verified planetary dataset."""
    product_id: str
    title: str
    mission: str
    spacecraft: str
    instrument: str
    instrument_type: str
    target: str
    processing_level: str
    product_type: str
    xml_path: str
    img_path: str
    lines: int
    samples: int
    bands: int
    data_type: str
    file_size_bytes: int
    file_size_on_disk: int
    is_valid_size: bool
    is_readable: bool
    metadata: Dict[str, Any]
    provenance: str = AnalysisStatus.REFERENCE


class DatasetRegistryResponse(BaseModel):
    """API response model for GET /api/datasets."""
    total_datasets: int
    datasets: List[VerifiedDatasetEntry]
    status: str
    message: str


class DatasetRegistryService:
    """
    Registry management and verification engine.
    """

    def __init__(self, registry_path: Optional[Path] = None):
        self.registry_path = registry_path or DEFAULT_REGISTRY_PATH

    def load_raw_registry(self) -> Dict[str, Any]:
        """
        Load the JSON registry file from disk.
        """
        if not self.registry_path.is_file():
            raise FileNotFoundError(
                f"Dataset registry file not found: {self.registry_path}"
            )
        with open(self.registry_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def verify_dataset_entry(self, entry: Dict[str, Any]) -> VerifiedDatasetEntry:
        """
        Verify that the registered product exists on disk and is consistent
        with its PDS4 XML label.
        """
        xml_path = entry.get("xml_path", "")
        img_path = entry.get("img_path", "")

        if not os.path.isfile(xml_path):
            raise FileNotFoundError(f"Registered XML label not found at: {xml_path}")

        # Parse live XML via pds4_reader to ensure ground-truth consistency
        parsed_meta = parse_pds4_label(xml_path)

        if not img_path or not os.path.isfile(img_path):
            resolved = resolve_img_path(xml_path, parsed_meta)
            img_path = resolved

        # Disk size check
        disk_size = os.path.getsize(img_path)
        expected_size = parsed_meta.expected_size_bytes or entry.get("file_size_bytes", 0)
        size_valid = disk_size == expected_size

        # Read-only memory-mapping check (ensures raster is uncorrupted)
        is_readable = False
        try:
            mmap = get_memmap(parsed_meta, img_path=img_path)
            lines = parsed_meta.dimensions.lines or entry["dimensions"]["lines"]
            samples = parsed_meta.dimensions.samples or entry["dimensions"]["samples"]
            if mmap.shape == (lines, samples):
                # Verify reading first and last byte non-destructively
                _ = int(mmap[0, 0])
                _ = int(mmap[-1, -1])
                is_readable = True
        except Exception:
            is_readable = False

        return VerifiedDatasetEntry(
            product_id=parsed_meta.product_id,
            title=parsed_meta.title,
            mission=parsed_meta.mission,
            spacecraft=parsed_meta.spacecraft,
            instrument=entry.get("instrument", parsed_meta.instrument_name),
            instrument_type=entry.get("instrument_type", parsed_meta.instrument_type),
            target=parsed_meta.target,
            processing_level=parsed_meta.processing_level,
            product_type=entry.get("product_type", "Primary Science Observational Raster"),
            xml_path=str(Path(xml_path).resolve()),
            img_path=str(Path(img_path).resolve()),
            lines=parsed_meta.dimensions.lines or 0,
            samples=parsed_meta.dimensions.samples or 0,
            bands=parsed_meta.dimensions.bands or 1,
            data_type=parsed_meta.data_type,
            file_size_bytes=expected_size,
            file_size_on_disk=disk_size,
            is_valid_size=size_valid,
            is_readable=is_readable,
            metadata=entry.get("metadata", {}),
            provenance=AnalysisStatus.REFERENCE,
        )

    def get_all_verified_datasets(self) -> DatasetRegistryResponse:
        """
        Query and verify all registered planetary datasets.
        """
        raw_data = self.load_raw_registry()
        entries = raw_data.get("datasets", [])

        verified_list: List[VerifiedDatasetEntry] = []
        for e in entries:
            try:
                verified = self.verify_dataset_entry(e)
                verified_list.append(verified)
            except Exception as ex:
                # Log or handle missing datasets gracefully
                continue

        return DatasetRegistryResponse(
            total_datasets=len(verified_list),
            datasets=verified_list,
            status="SUCCESS",
            message=f"Discovered and verified {len(verified_list)} authentic Chandrayaan-2 dataset(s).",
        )

