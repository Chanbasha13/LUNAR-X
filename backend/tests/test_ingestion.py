"""
Unit & Integration Tests for LUNAR-X PDS4 Ingestion Engine.
Tests against the REAL Chandrayaan-2 OHRC product on disk.
"""

import os
import sys
from pathlib import Path
import cv2
import numpy as np
import pytest

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.models.schemas import AnalysisStatus
from app.services.pds4_reader import parse_pds4_label
from app.services.image_loader import get_memmap, read_chip, compute_sparse_statistics
from app.services.preprocessing import generate_web_preview

REAL_XML_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.xml"
REAL_IMG_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.img"


def test_real_pds4_xml_parsing():
    """Verify XML parsing on real Chandrayaan-2 OHRC product."""
    assert os.path.exists(REAL_XML_PATH), f"Real XML not found at {REAL_XML_PATH}"
    
    meta = parse_pds4_label(REAL_XML_PATH)
    
    assert meta.spacecraft == "Chandrayaan 2 Orbiter"
    assert "orbiter high resolution camera" in meta.instrument_name.lower()
    assert meta.processing_level == "Calibrated"
    assert meta.orbit_number == 29426
    assert abs(meta.pixel_resolution_m - 0.25) < 1e-4
    assert abs(meta.solar_incidence_deg - 87.584858) < 1e-3
    assert meta.dimensions.lines == 91971
    assert meta.dimensions.samples == 12000
    assert meta.dimensions.bands == 1
    assert meta.data_type == "UnsignedByte"
    assert meta.offset_bytes == 0
    assert meta.expected_size_bytes == 1103652000
    assert meta.file_size_valid is True
    assert meta.status == AnalysisStatus.REFERENCE


def test_real_img_memmap_read():
    """Verify memory-mapped read on the 1.1 GB raw scientific IMG."""
    assert os.path.exists(REAL_IMG_PATH), f"Real IMG not found at {REAL_IMG_PATH}"
    
    meta = parse_pds4_label(REAL_XML_PATH)
    mmap = get_memmap(meta, img_path=REAL_IMG_PATH)
    
    # Check shape and dtype
    assert mmap.shape == (91971, 12000)
    assert mmap.dtype == np.uint8
    
    # Read a sub-region (chip) without crashing
    chip = read_chip(meta, 1000, 1500, 2000, 2500, img_path=REAL_IMG_PATH)
    assert chip.shape == (500, 500)
    assert chip.dtype == np.uint8


def test_sparse_statistics_computation():
    """Verify statistical calculation via strided sampling without high RAM usage."""
    stats = compute_sparse_statistics(REAL_XML_PATH, sample_step=200, img_path=REAL_IMG_PATH)
    assert stats["samples_evaluated"] > 0
    assert stats["min"] >= 0
    assert stats["max"] <= 255
    assert 0 <= stats["mean"] <= 255


def test_real_preview_generation(tmp_path):
    """Verify non-destructive preview generation from the real IMG."""
    res = generate_web_preview(
        REAL_XML_PATH,
        output_dir=tmp_path,
        max_dimension=1024,
        img_path=REAL_IMG_PATH,
    )
    
    assert os.path.isfile(res.preview_path)
    assert res.status == AnalysisStatus.COMPUTED
    assert res.original_lines == 91971
    assert res.original_samples == 12000
    assert max(res.preview_height, res.preview_width) == 1024
    
    # Verify the saved image can be read by OpenCV
    loaded_img = cv2.imread(res.preview_path, cv2.IMREAD_GRAYSCALE)
    assert loaded_img is not None
    assert loaded_img.shape == (res.preview_height, res.preview_width)


if __name__ == "__main__":
    print("Running manual test runner...")
    test_real_pds4_xml_parsing()
    print("[PASS] XML parsing verified.")
    test_real_img_memmap_read()
    print("[PASS] Memory-mapped IMG reading verified.")
    test_sparse_statistics_computation()
    print("[PASS] Sparse statistics computation verified.")
    test_preview_dir = Path(__file__).resolve().parents[1] / "data" / "previews"
    res = generate_web_preview(REAL_XML_PATH, output_dir=test_preview_dir, max_dimension=2048, img_path=REAL_IMG_PATH)
    print(f"[PASS] Real preview generated at: {res.preview_path}")
    print(f"       Preview dimensions: {res.preview_width} x {res.preview_height} px")
    print("ALL INGESTION TESTS PASSED!")

