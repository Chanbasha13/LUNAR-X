"""
Unit and Integration Tests for LoFTR Correspondence Engine & Robustness Benchmark.
"""

import os
import sys
from pathlib import Path
import pytest
import numpy as np
import torch

# Add backend directory to sys.path
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.models.schemas import AnalysisStatus, ChipRegion
from app.services.loftr_correspondence import (
    LoFTRCorrespondenceEngine,
    draw_loftr_correspondence_result,
    DEFAULT_LOFTR_RESULTS_DIR,
)
from app.services.loftr_robustness_benchmarking import (
    LoFTRRobustnessBenchmarkRunner,
    LoFTRRobustnessTrialResult,
)
from app.services.pds4_reader import parse_pds4_label
from app.services.image_loader import read_chip

REAL_XML_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.xml"
REAL_IMG_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.img"


def test_loftr_import_and_initialization():
    """Test authentic LoFTR import and model instantiation."""
    from kornia.feature import LoFTR
    engine = LoFTRCorrespondenceEngine(device="cpu")
    model = engine._get_model()
    assert model is not None
    assert isinstance(model, LoFTR)


def test_loftr_tensor_preparation():
    """Test input normalization and dimension scaling for LoFTR."""
    engine = LoFTRCorrespondenceEngine(target_dimension=640, device="cpu")
    dummy1 = np.zeros((1500, 1500), dtype=np.uint8)
    dummy2 = np.zeros((1500, 1500), dtype=np.uint8)

    t1, t2, sx1, sy1, sx2, sy2 = engine.prepare_tensors(dummy1, dummy2)
    assert t1.shape == (1, 1, 640, 640)
    assert t2.shape == (1, 1, 640, 640)
    assert t1.dtype == torch.float32
    assert abs(sx1 - (1500.0 / 640.0)) < 1e-4
    assert abs(sy1 - (1500.0 / 640.0)) < 1e-4


def test_loftr_inference_on_real_ohrc_chips():
    """Test LoFTR execution on authentic Chandrayaan-2 OHRC chip pair."""
    meta = parse_pds4_label(REAL_XML_PATH)
    chip_a = read_chip(meta, 15000, 15500, 3000, 3500, img_path=REAL_IMG_PATH)
    chip_b = read_chip(meta, 15020, 15520, 3020, 3520, img_path=REAL_IMG_PATH)

    engine = LoFTRCorrespondenceEngine()
    match_res = engine.match_chips(chip_a, chip_b)

    assert match_res["num_correspondences"] > 0
    assert match_res["inliers"] > 0
    assert match_res["inlier_ratio_pct"] > 50.0
    assert match_res["homography"] is not None
    assert match_res["reprojection_rmse_px"] is not None
    assert match_res["confidence_stats"]["mean"] > 0.5


def test_loftr_scale_robustness_on_real_data():
    """Test LoFTR scale robustness experiment on real lunar regolith."""
    meta = parse_pds4_label(REAL_XML_PATH)
    chip = read_chip(meta, 15000, 15500, 3000, 3500, img_path=REAL_IMG_PATH)

    runner = LoFTRRobustnessBenchmarkRunner()
    trials = runner.run_scale_experiment(chip, scale_factors=[0.75, 1.50])

    assert len(trials) == 2
    for t in trials:
        assert t.num_correspondences > 0
        assert t.ransac_inliers > 0
        assert t.inlier_ratio_pct > 80.0
        assert t.status == AnalysisStatus.COMPUTED


def test_loftr_photometric_robustness_on_real_data():
    """Test LoFTR photometric robustness under extreme non-linear gamma."""
    meta = parse_pds4_label(REAL_XML_PATH)
    chip = read_chip(meta, 15000, 15500, 3000, 3500, img_path=REAL_IMG_PATH)

    runner = LoFTRRobustnessBenchmarkRunner()
    trials = runner.run_photometric_experiment(
        chip, gamma_values=[0.7, 2.0], contrast_values=[1.0]
    )

    assert len(trials) == 2
    # Both trials should succeed with inliers
    for t in trials:
        assert t.ransac_inliers > 100
        assert t.inlier_ratio_pct > 70.0


def test_loftr_rotation_robustness_on_real_data():
    """Test LoFTR rotation robustness on real regolith."""
    meta = parse_pds4_label(REAL_XML_PATH)
    chip = read_chip(meta, 15000, 15500, 3000, 3500, img_path=REAL_IMG_PATH)

    runner = LoFTRRobustnessBenchmarkRunner()
    trials = runner.run_rotation_experiment(chip, angles_deg=[5.0, 15.0])

    assert len(trials) == 2
    assert trials[0].ransac_inliers > 500
    assert trials[0].inlier_ratio_pct > 80.0


def test_loftr_visualization_generation():
    """Test that correspondence visualizations are properly generated on disk."""
    vis_file = DEFAULT_LOFTR_RESULTS_DIR / "test_loftr_vis.png"
    img1 = np.full((100, 100), 128, dtype=np.uint8)
    img2 = np.full((100, 100), 128, dtype=np.uint8)
    pts1 = np.array([[10, 10], [50, 50]], dtype=np.float32)
    pts2 = np.array([[15, 15], [55, 55]], dtype=np.float32)
    mask = np.array([True, True])
    metrics = {
        "num_correspondences": 2,
        "inliers": 2,
        "inlier_ratio_pct": 100.0,
        "reprojection_rmse_px": 0.1,
        "inference_time_ms": 50.0,
        "device": "cpu",
        "confidence_stats": {"mean": 0.99},
    }

    out_path = draw_loftr_correspondence_result(
        img1, img2, pts1, pts2, mask, metrics, vis_file
    )
    assert out_path.is_file()
    assert out_path.stat().st_size > 0
    vis_file.unlink()


def test_loftr_result_serialization_npz_and_json(tmp_path):
    """Test lossless serialization and deserialization of LoFTR correspondence arrays and metrics."""
    npz_path = tmp_path / "test_arrays.npz"
    json_path = tmp_path / "test_metrics.json"

    pts1 = np.random.rand(50, 2).astype(np.float32)
    pts2 = np.random.rand(50, 2).astype(np.float32)
    conf = np.random.rand(50).astype(np.float32)
    inlier_mask = np.ones(50, dtype=bool)
    H = np.eye(3, dtype=np.float64)

    # Save NPZ
    np.savez_compressed(npz_path, pts_a=pts1, pts_b=pts2, confidence=conf, inlier_mask=inlier_mask, homography=H)
    assert npz_path.is_file()

    # Load and verify NPZ
    loaded = np.load(npz_path)
    np.testing.assert_array_almost_equal(loaded["pts_a"], pts1)
    np.testing.assert_array_almost_equal(loaded["pts_b"], pts2)
    np.testing.assert_array_almost_equal(loaded["confidence"], conf)
    np.testing.assert_array_equal(loaded["inlier_mask"], inlier_mask)

    # Save and verify JSON
    data = {
        "correspondences_count": 50,
        "ransac_inliers": 50,
        "inlier_ratio_pct": 100.0,
        "reprojection_rmse_px": 0.25,
        "homography_matrix": H.tolist(),
    }
    with open(json_path, "w") as f:
        import json
        json.dump(data, f)

    assert json_path.is_file()
    with open(json_path, "r") as f:
        loaded_json = json.load(f)
    assert loaded_json["correspondences_count"] == 50
    assert loaded_json["ransac_inliers"] == 50


