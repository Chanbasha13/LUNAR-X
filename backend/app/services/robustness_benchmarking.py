"""
Scientific Robustness Benchmarking Suite for LUNAR-X (SIH26166).

Executes rigorous, controlled transformation experiments on REAL Chandrayaan-2
OHRC imagery to establish a verifiable baseline for SIFT feature correspondence:
  1. Scale Variation Robustness (0.5x, 0.75x, 1.0x, 1.5x, 2.0x)
  2. Photometric / Lighting Variation Robustness (Gamma, Contrast, Shadow Attenuation)
  3. Geometric Rotation Robustness (5°, 15°, 30°, 45°)

SCIENTIFIC PROVENANCE:
- All source pixel data is extracted from the real 1.03 GB PDS4 OHRC raster.
- Source raster is NEVER modified.
- All derived transformations are explicitly labeled as [CONTROLLED TRANSFORMATION].
- All metrics are calculated strictly from algorithmic execution [COMPUTED].
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import cv2
import numpy as np

from app.models.schemas import (
    AnalysisStatus,
    ChipRegion,
    DetailedCorrespondenceMetrics,
    PDS4Metadata,
    RobustnessBenchmarkReport,
    RobustnessTrialResult,
)
from app.services.correspondence_engine import (
    SIFTCorrespondenceEngine,
    draw_correspondence_result,
    validate_chip_bounds,
)
from app.services.image_loader import read_chip, resolve_img_path
from app.services.pds4_reader import parse_pds4_label
from app.services.preprocessing import normalize_and_contrast_stretch

# Output directory for robustness visualizations
DEFAULT_ROBUSTNESS_DIR = Path(__file__).resolve().parents[2] / "data" / "results" / "robustness"


# ---------------------------------------------------------------------------
# Controlled Transformation Primitives
# ---------------------------------------------------------------------------
def apply_scale(image: np.ndarray, scale_factor: float) -> np.ndarray:
    """
    Apply controlled spatial isotropic scaling to an image chip.
    """
    if scale_factor <= 0:
        raise ValueError(f"Scale factor must be positive, got {scale_factor}")

    h, w = image.shape[:2]
    new_w = max(16, int(round(w * scale_factor)))
    new_h = max(16, int(round(h * scale_factor)))

    interp = cv2.INTER_AREA if scale_factor < 1.0 else cv2.INTER_CUBIC
    scaled = cv2.resize(image, (new_w, new_h), interpolation=interp)
    return scaled


def apply_rotation(image: np.ndarray, angle_deg: float) -> np.ndarray:
    """
    Apply controlled in-plane Euclidean rotation around the image center.
    """
    h, w = image.shape[:2]
    center = (w / 2.0, h / 2.0)
    M = cv2.getRotationMatrix2D(center, angle_deg, scale=1.0)
    rotated = cv2.warpAffine(
        image,
        M,
        (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_REFLECT_101,
    )
    return rotated


def apply_photometric_variation(
    image: np.ndarray,
    gamma: float = 1.0,
    contrast_factor: float = 1.0,
    brightness_bias: float = 0.0,
) -> np.ndarray:
    """
    Apply controlled non-linear photometric transformations (Gamma, Contrast, Brightness).
    Used strictly as a [CONTROLLED PHOTOMETRIC TEST] to evaluate feature descriptor invariance.
    """
    if gamma <= 0:
        raise ValueError(f"Gamma must be positive, got {gamma}")

    img_float = image.astype(np.float32) / 255.0
    # Apply power-law gamma curve
    gamma_corrected = np.power(img_float, gamma)
    # Apply contrast multiplier and brightness bias
    adjusted = gamma_corrected * contrast_factor * 255.0 + brightness_bias
    clipped = np.clip(adjusted, 0, 255).astype(np.uint8)
    return clipped


# ---------------------------------------------------------------------------
# Robustness Trial Runner
# ---------------------------------------------------------------------------
def run_single_robustness_trial(
    ref_image: np.ndarray,
    transformed_image: np.ndarray,
    experiment_type: str,
    parameter_name: str,
    parameter_value: float,
    label: str,
    output_dir: Path,
    engine: Optional[SIFTCorrespondenceEngine] = None,
) -> RobustnessTrialResult:
    """
    Execute SIFT feature extraction, matching, and RANSAC estimation on a
    reference vs. transformed pair, and export the correspondence visualization.
    """
    if engine is None:
        engine = SIFTCorrespondenceEngine(
            nfeatures=5000,
            ratio_threshold=0.75,
            ransac_threshold=3.0,
        )

    t0 = time.perf_counter()

    # Preprocess both images
    proc1 = normalize_and_contrast_stretch(ref_image)
    proc2 = normalize_and_contrast_stretch(transformed_image)

    # SIFT feature detection & description
    kp1, desc1 = engine.extract_features(proc1)
    kp2, desc2 = engine.extract_features(proc2)

    # Matching & Lowe's ratio test
    good_matches, raw_matches = engine.match_features(desc1, desc2)

    # Geometric transformation via RANSAC
    H, mask, inlier_count, rmse = engine.estimate_geometric_transform(kp1, kp2, good_matches)

    elapsed_ms = (time.perf_counter() - t0) * 1000.0

    inlier_ratio_pct = (
        (inlier_count / len(good_matches) * 100.0) if len(good_matches) > 0 else 0.0
    )

    # Save visualization
    sanitized_label = label.replace(" ", "_").replace(".", "p").replace("°", "deg").replace("×", "x").replace("/", "_")
    vis_filename = f"robustness_{experiment_type}_{sanitized_label}_{int(time.time())}.png"
    vis_path = output_dir / vis_filename

    vis_saved_path = draw_correspondence_result(
        proc1, proc2, kp1, kp2, good_matches, mask, vis_path
    )

    return RobustnessTrialResult(
        experiment_type=experiment_type,
        parameter_name=parameter_name,
        parameter_value=float(parameter_value),
        label=label,
        keypoints_ref=len(kp1),
        keypoints_trans=len(kp2),
        raw_matches=raw_matches,
        good_matches=len(good_matches),
        ransac_inliers=inlier_count,
        inlier_ratio_pct=round(inlier_ratio_pct, 2),
        reprojection_rmse_px=round(rmse, 4) if inlier_count >= 4 else None,
        processing_time_ms=round(elapsed_ms, 2),
        visualization_path=vis_saved_path,
        visualization_url=f"/static/results/robustness/{vis_filename}",
        status=AnalysisStatus.COMPUTED,
    )


# ---------------------------------------------------------------------------
# Comprehensive Benchmark Suite
# ---------------------------------------------------------------------------
def run_scale_experiment(
    ref_image: np.ndarray,
    output_dir: Path,
    scales: List[float] = [0.5, 0.75, 1.0, 1.5, 2.0],
) -> List[RobustnessTrialResult]:
    """
    Experiment 1: Scale Invariance Benchmark across controlled scale factors.
    """
    trials = []
    for s in scales:
        scaled_img = apply_scale(ref_image, s)
        trial = run_single_robustness_trial(
            ref_image=ref_image,
            transformed_image=scaled_img,
            experiment_type="scale",
            parameter_name="scale_factor",
            parameter_value=s,
            label=f"Scale {s}x",
            output_dir=output_dir,
        )
        trials.append(trial)
    return trials


def run_rotation_experiment(
    ref_image: np.ndarray,
    output_dir: Path,
    angles: List[float] = [5.0, 15.0, 30.0, 45.0],
) -> List[RobustnessTrialResult]:
    """
    Experiment 3: Rotation Invariance Benchmark across controlled planar rotation angles.
    """
    trials = []
    for a in angles:
        rot_img = apply_rotation(ref_image, a)
        trial = run_single_robustness_trial(
            ref_image=ref_image,
            transformed_image=rot_img,
            experiment_type="rotation",
            parameter_name="rotation_deg",
            parameter_value=a,
            label=f"Rotation {a}°",
            output_dir=output_dir,
        )
        trials.append(trial)
    return trials


def run_photometric_experiment(
    ref_image: np.ndarray,
    output_dir: Path,
) -> List[RobustnessTrialResult]:
    """
    Experiment 2: Controlled Photometric Test (Gamma, Contrast, Shadow Attenuation).
    """
    variations = [
        {"name": "gamma_0.5 (Shadow Lift)", "gamma": 0.5, "contrast": 1.0, "bias": 0.0, "val": 0.5},
        {"name": "gamma_0.7 (Brightened)", "gamma": 0.7, "contrast": 1.0, "bias": 0.0, "val": 0.7},
        {"name": "gamma_1.0 (Baseline)", "gamma": 1.0, "contrast": 1.0, "bias": 0.0, "val": 1.0},
        {"name": "gamma_1.5 (Darkened)", "gamma": 1.5, "contrast": 1.0, "bias": 0.0, "val": 1.5},
        {"name": "gamma_2.0 (Deep Shadow)", "gamma": 2.0, "contrast": 1.0, "bias": 0.0, "val": 2.0},
        {"name": "contrast_0.5 (Low Contrast)", "gamma": 1.0, "contrast": 0.5, "bias": 0.0, "val": 0.5},
        {"name": "contrast_1.5 (High Contrast)", "gamma": 1.0, "contrast": 1.5, "bias": 0.0, "val": 1.5},
    ]

    trials = []
    for v in variations:
        photo_img = apply_photometric_variation(
            ref_image,
            gamma=v["gamma"],
            contrast_factor=v["contrast"],
            brightness_bias=v["bias"],
        )
        trial = run_single_robustness_trial(
            ref_image=ref_image,
            transformed_image=photo_img,
            experiment_type="photometric",
            parameter_name="gamma" if "gamma" in v["name"] else "contrast",
            parameter_value=v["val"],
            label=v["name"],
            output_dir=output_dir,
        )
        trials.append(trial)
    return trials


def execute_full_robustness_benchmark(
    xml_path: str,
    chip_bounds: Optional[ChipRegion] = None,
    output_dir: Optional[Union[str, Path]] = None,
    img_path: Optional[str] = None,
) -> RobustnessBenchmarkReport:
    """
    Execute the entire scientific robustness benchmark suite on the real Chandrayaan-2 OHRC raster.
    """
    meta = parse_pds4_label(xml_path)
    total_lines = meta.dimensions.lines or 91971
    total_samples = meta.dimensions.samples or 12000

    # Default representative chip (crater terrain with distinct morphology)
    if chip_bounds is None:
        chip_bounds = ChipRegion(
            row_start=15000,
            row_end=16500,
            col_start=3000,
            col_end=4500,
        )

    validate_chip_bounds(chip_bounds, total_lines, total_samples)

    if img_path is None:
        img_path = resolve_img_path(xml_path, meta)

    # Read the real chip from disk (1500x1500 px = ~2.2 MB in RAM)
    ref_chip = read_chip(
        meta,
        chip_bounds.row_start,
        chip_bounds.row_end,
        chip_bounds.col_start,
        chip_bounds.col_end,
        img_path=img_path,
    )

    out_dir = Path(output_dir) if output_dir else DEFAULT_ROBUSTNESS_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    # Run all 3 controlled benchmark experiments
    scale_results = run_scale_experiment(ref_chip, out_dir)
    rotation_results = run_rotation_experiment(ref_chip, out_dir)
    photometric_results = run_photometric_experiment(ref_chip, out_dir)

    notes = (
        "SIFT Baseline Robustness Suite executed on real Chandrayaan-2 OHRC raster. "
        "Controlled transformations (scale, planar rotation, synthetic photometric adjustments) "
        "measure classical descriptor behavior under geometric/photometric perturbations."
    )

    return RobustnessBenchmarkReport(
        product_id=meta.product_id,
        chip_bounds=chip_bounds,
        scale_trials=scale_results,
        rotation_trials=rotation_results,
        photometric_trials=photometric_results,
        summary_notes=notes,
        status=AnalysisStatus.COMPUTED,
    )

