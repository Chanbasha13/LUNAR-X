"""
Unit and Integration Tests for SIFT Robustness Benchmarking Suite.
Executes controlled transformation experiments on the REAL Chandrayaan-2 OHRC raster.
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
from app.services.robustness_benchmarking import (
    apply_photometric_variation,
    apply_rotation,
    apply_scale,
    execute_full_robustness_benchmark,
    run_photometric_experiment,
    run_rotation_experiment,
    run_scale_experiment,
)

REAL_XML_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.xml"
REAL_IMG_PATH = "/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/data/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_d_img_d18.img"


def test_scale_transformation_math():
    """Verify scale transformation handles up/down scaling accurately."""
    dummy = np.zeros((200, 200), dtype=np.uint8)
    
    # 0.5x
    scaled_half = apply_scale(dummy, 0.5)
    assert scaled_half.shape == (100, 100)
    
    # 1.5x
    scaled_1p5 = apply_scale(dummy, 1.5)
    assert scaled_1p5.shape == (300, 300)
    
    # Invalid scale
    with pytest.raises(ValueError, match="positive"):
        apply_scale(dummy, -0.5)


def test_rotation_transformation_math():
    """Verify rotation preserves shape and rotates around center."""
    dummy = np.zeros((300, 400), dtype=np.uint8)
    rotated = apply_rotation(dummy, 45.0)
    assert rotated.shape == (300, 400)
    assert rotated.dtype == np.uint8


def test_photometric_transformation_properties():
    """Verify gamma and contrast adjustments stay in [0, 255] range."""
    dummy = np.linspace(0, 255, 1000, dtype=np.uint8).reshape(10, 100)
    
    # Gamma 0.5 (brighten)
    bright = apply_photometric_variation(dummy, gamma=0.5)
    assert bright.min() >= 0
    assert bright.max() <= 255
    assert bright.mean() > dummy.mean()
    
    # Gamma 2.0 (darken)
    dark = apply_photometric_variation(dummy, gamma=2.0)
    assert dark.min() >= 0
    assert dark.max() <= 255
    assert dark.mean() < dummy.mean()

    # Invalid gamma
    with pytest.raises(ValueError, match="positive"):
        apply_photometric_variation(dummy, gamma=0.0)


def test_experiment_1_scale_robustness_on_real_data(tmp_path):
    """Verify Experiment 1 (Scale Invariance) on real Chandrayaan-2 chip."""
    meta = parse_pds4_label(REAL_XML_PATH)
    chip = read_chip(meta, 15000, 16000, 3000, 4000, img_path=REAL_IMG_PATH)
    
    results = run_scale_experiment(chip, output_dir=tmp_path, scales=[0.5, 1.0, 1.5])
    assert len(results) == 3
    
    for r in results:
        assert r.experiment_type == "scale"
        assert r.status == AnalysisStatus.COMPUTED
        assert r.keypoints_ref > 100
        assert r.keypoints_trans > 50
        assert r.good_matches > 10
        assert r.ransac_inliers > 5
        assert r.reprojection_rmse_px is not None
        assert os.path.isfile(r.visualization_path)


def test_experiment_2_photometric_robustness_on_real_data(tmp_path):
    """Verify Experiment 2 (Photometric Robustness) on real Chandrayaan-2 chip."""
    meta = parse_pds4_label(REAL_XML_PATH)
    chip = read_chip(meta, 15000, 16000, 3000, 4000, img_path=REAL_IMG_PATH)
    
    results = run_photometric_experiment(chip, output_dir=tmp_path)
    assert len(results) >= 5
    
    for r in results:
        assert r.experiment_type == "photometric"
        assert r.status == AnalysisStatus.COMPUTED
        assert r.good_matches > 50
        assert r.ransac_inliers > 30
        assert r.reprojection_rmse_px is not None
        assert os.path.isfile(r.visualization_path)


def test_experiment_3_rotation_robustness_on_real_data(tmp_path):
    """Verify Experiment 3 (Rotation Robustness) on real Chandrayaan-2 chip."""
    meta = parse_pds4_label(REAL_XML_PATH)
    chip = read_chip(meta, 15000, 16000, 3000, 4000, img_path=REAL_IMG_PATH)
    
    results = run_rotation_experiment(chip, output_dir=tmp_path, angles=[5.0, 15.0, 30.0])
    assert len(results) == 3
    
    for r in results:
        assert r.experiment_type == "rotation"
        assert r.status == AnalysisStatus.COMPUTED
        assert r.keypoints_ref > 100
        assert r.good_matches > 20
        assert r.ransac_inliers > 10
        assert os.path.isfile(r.visualization_path)


def test_full_robustness_benchmark_pipeline():
    """Verify end-to-end execution of full benchmark suite saving to results directory."""
    chip = ChipRegion(row_start=15000, row_end=16000, col_start=3000, col_end=4000)
    report = execute_full_robustness_benchmark(
        xml_path=REAL_XML_PATH,
        chip_bounds=chip,
        img_path=REAL_IMG_PATH,
    )
    
    assert report.status == AnalysisStatus.COMPUTED
    assert len(report.scale_trials) == 5       # 0.5, 0.75, 1.0, 1.5, 2.0
    assert len(report.rotation_trials) == 4    # 5°, 15°, 30°, 45°
    assert len(report.photometric_trials) == 7 # gamma 0.5..2.0, contrast 0.5..1.5


if __name__ == "__main__":
    print("Running SIFT robustness benchmark tests...")
    test_scale_transformation_math()
    print("[PASS] Scale transformation math.")
    test_rotation_transformation_math()
    print("[PASS] Rotation transformation math.")
    test_photometric_transformation_properties()
    print("[PASS] Photometric transformation properties.")
    test_full_robustness_benchmark_pipeline()
    print("[PASS] Full robustness benchmark pipeline on real Chandrayaan-2 data.")
    print("ALL ROBUSTNESS TESTS PASSED!")

