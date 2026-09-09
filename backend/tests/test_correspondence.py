"""
Unit & Integration Tests for LUNAR-X SIFT + RANSAC Correspondence Engine.
Tests against the REAL Chandrayaan-2 OHRC raster on disk.
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

from app.models.schemas import AnalysisStatus, ChipRegion
from app.services.image_loader import read_chip
from app.services.pds4_reader import parse_pds4_label
from app.services.correspondence_engine import (
    SIFTCorrespondenceEngine,
    compute_reprojection_rmse,
    execute_sift_on_real_raster,
    validate_chip_bounds,
)

REAL_XML_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.xml"
REAL_IMG_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.img"


def test_chip_boundary_validation():
    """Verify bounds validation rejects invalid coordinates."""
    # Valid region
    valid = ChipRegion(row_start=100, row_end=500, col_start=200, col_end=600)
    validate_chip_bounds(valid, total_lines=91971, total_samples=12000)

    # Exceeds max lines
    with pytest.raises(ValueError, match="exceeds raster height"):
        invalid_y = ChipRegion(row_start=90000, row_end=95000, col_start=0, col_end=1000)
        validate_chip_bounds(invalid_y, total_lines=91971, total_samples=12000)

    # Exceeds max samples
    with pytest.raises(ValueError, match="exceeds raster width"):
        invalid_x = ChipRegion(row_start=0, row_end=1000, col_start=10000, col_end=15000)
        validate_chip_bounds(invalid_x, total_lines=91971, total_samples=12000)

    # Inverted range
    with pytest.raises(ValueError, match="Invalid row range"):
        inverted = ChipRegion(row_start=500, row_end=100, col_start=0, col_end=1000)
        validate_chip_bounds(inverted, total_lines=91971, total_samples=12000)


def test_reprojection_rmse_math():
    """Verify RMSE calculates zero error for an identity transform."""
    pts1 = np.array([[10.0, 20.0], [50.0, 60.0], [100.0, 150.0], [200.0, 250.0]])
    H_ident = np.eye(3, dtype=np.float64)
    rmse = compute_reprojection_rmse(pts1, pts1, H_ident)
    assert rmse < 1e-6

    # Test with known 2-pixel translation
    H_trans = np.array([[1.0, 0.0, 2.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]])
    pts2 = pts1 + np.array([2.0, 0.0])
    rmse_trans = compute_reprojection_rmse(pts1, pts2, H_trans)
    assert rmse_trans < 1e-6


def test_sift_feature_extraction_on_real_chip():
    """Verify SIFT detects keypoints and 128-D descriptors on real lunar regolith."""
    meta = parse_pds4_label(REAL_XML_PATH)
    chip = read_chip(meta, 12000, 13000, 4000, 5000, img_path=REAL_IMG_PATH)
    assert chip.shape == (1000, 1000)

    engine = SIFTCorrespondenceEngine(nfeatures=1000)
    kp, desc = engine.extract_features(chip)

    assert len(kp) > 50, "Expected significant keypoints in real lunar crater terrain"
    assert desc.shape[1] == 128, "SIFT descriptor dimension must be 128"


def test_real_sift_ransac_pipeline():
    """Verify full end-to-end correspondence pipeline on real Chandrayaan-2 OHRC raster."""
    results_dir = BACKEND_DIR / "data" / "results"
    
    chip_a = ChipRegion(row_start=15000, row_end=16500, col_start=3000, col_end=4500)
    chip_b = ChipRegion(row_start=15040, row_end=16540, col_start=3040, col_end=4540)

    result = execute_sift_on_real_raster(
        xml_path=REAL_XML_PATH,
        chip_a=chip_a,
        chip_b=chip_b,
        ratio_threshold=0.75,
        ransac_threshold=3.0,
        img_path=REAL_IMG_PATH,
        output_dir=results_dir,
    )

    assert result.status == AnalysisStatus.COMPUTED
    assert result.feature_method == "SIFT"
    assert result.detailed_metrics is not None

    d = result.detailed_metrics
    assert d.keypoints_img1 > 100
    assert d.keypoints_img2 > 100
    assert d.good_matches > 50
    assert d.ransac_inliers > 30
    assert d.inlier_ratio_pct > 50.0
    assert d.reprojection_rmse_px is not None
    assert d.reprojection_rmse_px < 5.0  # Sub-pixel to low-pixel RMSE
    assert d.transformation_matrix is not None
    assert len(d.transformation_matrix) == 3
    assert len(d.transformation_matrix[0]) == 3
    assert d.processing_time_ms > 0

    # Verify generated visualization file on disk
    assert d.visualization_path is not None
    assert os.path.isfile(d.visualization_path)
    img = cv2.imread(d.visualization_path)
    assert img is not None
    assert img.shape[0] > 1000
    assert img.shape[1] > 1000


def test_match_uploaded_images_api():
    """Verify POST /api/correspondence/match-images with uploaded image files."""
    from fastapi.testclient import TestClient
    from app.main import app

    client = TestClient(app)

    # Use existing real derived chips
    p_ohrc = BACKEND_DIR / "data" / "results" / "multi_sensor" / "correspondence" / "ohrc_real_chip.png"
    p_tmc = BACKEND_DIR / "data" / "results" / "multi_sensor" / "correspondence" / "tmc2_real_chip.png"

    assert p_ohrc.is_file(), f"Missing real OHRC chip at {p_ohrc}"
    assert p_tmc.is_file(), f"Missing real TMC-2 chip at {p_tmc}"

    with open(p_ohrc, "rb") as f_a, open(p_tmc, "rb") as f_b:
        response = client.post(
            "/api/correspondence/match-images",
            files={
                "image_a": ("ohrc_real_chip.png", f_a, "image/png"),
                "image_b": ("tmc2_real_chip.png", f_b, "image/png"),
            },
            data={"method": "loftr", "ransac_threshold": 5.0},
        )

    assert response.status_code == 200, f"API error: {response.text}"
    data = response.json()
    assert data["status"] == "COMPUTED"
    assert "LoFTR" in data["feature_method"]
    assert int(data["dense_correspondences"]["value"]) > 0
    assert data["latitude"]["value"] is not None
    assert data["longitude"]["value"] is not None
    assert data["sun_angle_variance"]["value"] is not None


if __name__ == "__main__":
    print("Running SIFT correspondence tests...")
    test_chip_boundary_validation()
    print("[PASS] Boundary validation.")
    test_reprojection_rmse_math()
    print("[PASS] Reprojection RMSE math.")
    test_sift_feature_extraction_on_real_chip()
    print("[PASS] SIFT feature extraction on real OHRC chip.")
    test_real_sift_ransac_pipeline()
    print("[PASS] Full SIFT + RANSAC pipeline on real Chandrayaan-2 raster.")
    test_match_uploaded_images_api()
    print("[PASS] Match uploaded images API integration test.")
    print("ALL SIFT CORRESPONDENCE TESTS PASSED!")


