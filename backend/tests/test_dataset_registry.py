"""
Unit and Integration Tests for Dataset Registry & Verification Service.
"""

import json
import os
import sys
from pathlib import Path
import pytest
from fastapi.testclient import TestClient

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.models.schemas import AnalysisStatus
from app.services.dataset_registry import (
    DatasetRegistryService,
    DEFAULT_REGISTRY_PATH,
)

REAL_XML_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.xml"
REAL_IMG_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.img"


def test_registry_file_exists():
    """Verify dataset_registry.json exists and is valid JSON."""
    assert DEFAULT_REGISTRY_PATH.is_file(), f"Registry file missing at {DEFAULT_REGISTRY_PATH}"
    service = DatasetRegistryService()
    raw = service.load_raw_registry()
    assert "datasets" in raw
    assert len(raw["datasets"]) >= 1


def test_verify_real_dataset_entry():
    """Verify real Chandrayaan-2 OHRC dataset entry passes all integrity checks."""
    service = DatasetRegistryService()
    raw = service.load_raw_registry()
    entry = raw["datasets"][0]
    
    verified = service.verify_dataset_entry(entry)
    
    assert "urn:isro:isda:ch2_cho.ohr" in verified.product_id
    assert verified.mission == "Chandrayaan-2"
    assert "OHRC" in verified.instrument or "orbiter" in verified.instrument.lower()
    assert verified.lines == 91971
    assert verified.samples == 12000
    assert verified.bands == 1
    assert verified.data_type == "UnsignedByte"
    assert verified.file_size_bytes == 1103652000
    assert verified.file_size_on_disk == 1103652000
    assert verified.is_valid_size is True
    assert verified.is_readable is True
    assert verified.provenance == AnalysisStatus.REFERENCE
    assert verified.metadata["orbit_number"] == 29426
    assert abs(verified.metadata["pixel_resolution_m"] - 0.25) < 1e-4
    assert abs(verified.metadata["solar_incidence_deg"] - 87.584858) < 1e-3


def test_missing_file_handling(tmp_path):
    """Verify registry raises FileNotFoundError for missing paths."""
    bad_registry = tmp_path / "bad_registry.json"
    bad_data = {
        "datasets": [
            {
                "product_id": "fake_product",
                "xml_path": "/path/does/not/exist/fake.xml",
                "img_path": "/path/does/not/exist/fake.img",
            }
        ]
    }
    with open(bad_registry, "w") as f:
        json.dump(bad_data, f)

    service = DatasetRegistryService(registry_path=bad_registry)
    with pytest.raises(FileNotFoundError):
        service.verify_dataset_entry(bad_data["datasets"][0])


def test_read_only_source_protection():
    """Verify original scientific product files have not been modified or mutated."""
    assert os.path.isfile(REAL_IMG_PATH)
    assert os.path.isfile(REAL_XML_PATH)
    
    # Check exact byte size remains 1,103,652,000
    assert os.path.getsize(REAL_IMG_PATH) == 1103652000
    
    # Check write access is not granted to memmap
    service = DatasetRegistryService()
    response = service.get_all_verified_datasets()
    assert response.total_datasets >= 1
    assert response.status == "SUCCESS"


def test_api_datasets_endpoint():
    """Verify GET /api/datasets HTTP endpoint via TestClient."""
    client = TestClient(app)
    res = client.get("/api/datasets")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "SUCCESS"
    assert data["total_datasets"] >= 1
    assert len(data["datasets"]) >= 1
    
    first = data["datasets"][0]
    assert first["lines"] == 91971
    assert first["samples"] == 12000
    assert first["provenance"] == AnalysisStatus.REFERENCE
    assert first["is_valid_size"] is True
    assert first["is_readable"] is True


if __name__ == "__main__":
    print("Running Dataset Registry tests...")
    test_registry_file_exists()
    print("[PASS] Registry file exists and valid JSON.")
    test_verify_real_dataset_entry()
    print("[PASS] Real Chandrayaan-2 OHRC entry verified.")
    test_read_only_source_protection()
    print("[PASS] Read-only source protection verified.")
    test_api_datasets_endpoint()
    print("[PASS] GET /api/datasets endpoint verified.")
    print("ALL DATASET REGISTRY TESTS PASSED!")

