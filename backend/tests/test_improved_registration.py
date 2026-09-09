"""
Unit & Integration Tests for LUNAR-X Improved Registration Pipeline & Preprocessing.
"""

import sys
from pathlib import Path
import numpy as np
import pytest
from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.main import app
from app.services.registration_experiments import (
    apply_clahe,
    apply_gradient_magnitude,
    apply_homomorphic_filter,
    apply_local_contrast_normalization,
    apply_morphological_crater_filter,
    apply_percentile_stretch,
    evaluate_geometric_consistency,
)


def test_preprocessing_output_properties():
    """Verify all preprocessing functions preserve image shape and uint8 dtype."""
    sample_img = np.random.randint(20, 200, size=(128, 128), dtype=np.uint8)

    # 1. Percentile stretch
    p_stretch = apply_percentile_stretch(sample_img)
    assert p_stretch.shape == sample_img.shape
    assert p_stretch.dtype == np.uint8

    # 2. CLAHE
    p_clahe = apply_clahe(sample_img, clip_limit=2.0)
    assert p_clahe.shape == sample_img.shape
    assert p_clahe.dtype == np.uint8

    # 3. Local Contrast Normalization
    p_lcn = apply_local_contrast_normalization(sample_img)
    assert p_lcn.shape == sample_img.shape
    assert p_lcn.dtype == np.uint8

    # 4. Gradient Magnitude
    p_grad = apply_gradient_magnitude(sample_img)
    assert p_grad.shape == sample_img.shape
    assert p_grad.dtype == np.uint8

    # 5. Morphological filter
    p_morph = apply_morphological_crater_filter(sample_img)
    assert p_morph.shape == sample_img.shape
    assert p_morph.dtype == np.uint8

    # 6. Homomorphic filter
    p_homo = apply_homomorphic_filter(sample_img)
    assert p_homo.shape == sample_img.shape
    assert p_homo.dtype == np.uint8


def test_geometric_consistency_estimators():
    """Verify RANSAC, MAGSAC, and Affine estimators handle identity and noisy points."""
    pts1 = np.array([[10.0, 10.0], [50.0, 10.0], [50.0, 50.0], [10.0, 50.0]], dtype=np.float32)
    pts2 = pts1.copy()

    # RANSAC
    inliers, ratio, rmse, H, mask = evaluate_geometric_consistency(pts1, pts2, "homography_ransac", 3.0)
    assert inliers == 4
    assert ratio == 100.0
    assert rmse is not None and rmse < 1e-4

    # MAGSAC
    inliers_m, ratio_m, rmse_m, H_m, mask_m = evaluate_geometric_consistency(pts1, pts2, "homography_magsac", 3.0)
    assert inliers_m == 4
    assert ratio_m == 100.0
    assert rmse_m is not None and rmse_m < 1e-4

    # Partial Affine
    inliers_a, ratio_a, rmse_a, H_a, mask_a = evaluate_geometric_consistency(pts1, pts2, "affine_partial", 3.0)
    assert inliers_a == 4
    assert ratio_a == 100.0


def test_api_enhanced_registration_modes():
    """Verify POST /api/correspondence/match-images with enhanced preprocessing and models."""
    client = TestClient(app)

    p_ohrc = BACKEND_DIR / "data" / "results" / "multi_sensor" / "correspondence" / "ohrc_real_chip.png"
    p_tmc = BACKEND_DIR / "data" / "results" / "multi_sensor" / "correspondence" / "tmc2_real_chip.png"

    with open(p_ohrc, "rb") as f_a, open(p_tmc, "rb") as f_b:
        resp = client.post(
            "/api/correspondence/match-images",
            files={
                "image_a": ("ohrc.png", f_a, "image/png"),
                "image_b": ("tmc2.png", f_b, "image/png"),
            },
            data={
                "method": "loftr",
                "preprocessing": "clahe",
                "estimator": "magsac",
                "ransac_threshold": 5.0,
            },
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "COMPUTED"
    assert "CLAHE" in data["feature_method"]
    assert "MAGSAC" in data["feature_method"]
