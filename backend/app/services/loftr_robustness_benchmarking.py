"""
Scientific Robustness Benchmarking Suite for LoFTR on LUNAR-X (SIH26166).

Executes controlled transformation experiments on REAL Chandrayaan-2 OHRC imagery:
  1. Scale Variation Robustness (0.50x, 0.75x, 1.00x, 1.50x, 2.00x)
  2. Photometric / Lighting Variation Robustness (Gamma 0.5-2.0, Contrast 0.5-1.5x)
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
from pydantic import BaseModel, Field

from app.models.schemas import (
    AnalysisStatus,
    ChipRegion,
    PDS4Metadata,
)
from app.services.image_loader import read_chip, resolve_img_path
from app.services.loftr_correspondence import (
    LoFTRCorrespondenceEngine,
    draw_loftr_correspondence_result,
)
from app.services.pds4_reader import parse_pds4_label
from app.services.preprocessing import normalize_and_contrast_stretch
from app.services.robustness_benchmarking import (
    apply_photometric_variation,
    apply_rotation,
    apply_scale,
)

DEFAULT_LOFTR_ROBUSTNESS_DIR = (
    Path(__file__).resolve().parents[2] / "data" / "results" / "loftr_robustness"
)


class LoFTRRobustnessTrialResult(BaseModel):
    """Result of a single LoFTR controlled transformation test."""
    experiment_type: str = Field(description="scale | rotation | photometric")
    parameter_name: str
    parameter_value: float
    label: str
    num_correspondences: int
    confidence_min: float
    confidence_max: float
    confidence_mean: float
    confidence_median: float
    ransac_inliers: int
    inlier_ratio_pct: float
    reprojection_rmse_px: Optional[float] = None
    inference_time_ms: float
    processing_time_ms: float
    visualization_path: Optional[str] = None
    status: str = AnalysisStatus.COMPUTED


class LoFTRBenchmarkReport(BaseModel):
    """Full LoFTR benchmark report across all controlled transformations."""
    product_id: str
    chip_bounds: ChipRegion
    scale_trials: List[LoFTRRobustnessTrialResult]
    photometric_trials: List[LoFTRRobustnessTrialResult]
    rotation_trials: List[LoFTRRobustnessTrialResult]
    device: str
    status: str = AnalysisStatus.COMPUTED


class LoFTRRobustnessBenchmarkRunner:
    """
    Orchestrates controlled robustness trials for LoFTR on real OHRC imagery.
    """

    def __init__(
        self,
        output_dir: Optional[Union[str, Path]] = None,
        device: Optional[str] = None,
    ):
        self.output_dir = Path(output_dir) if output_dir else DEFAULT_LOFTR_ROBUSTNESS_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.engine = LoFTRCorrespondenceEngine(device=device)

    def run_scale_experiment(
        self,
        base_chip: np.ndarray,
        scale_factors: Optional[List[float]] = None,
    ) -> List[LoFTRRobustnessTrialResult]:
        """
        Experiment 1: Spatial Scale Robustness (0.50x, 0.75x, 1.00x, 1.50x, 2.00x).
        """
        if scale_factors is None:
            scale_factors = [0.50, 0.75, 1.00, 1.50, 2.00]

        results = []
        proc_ref = normalize_and_contrast_stretch(base_chip)

        for s in scale_factors:
            t0 = time.perf_counter()
            scaled_target = apply_scale(proc_ref, s)
            proc_target = normalize_and_contrast_stretch(scaled_target)

            match_res = self.engine.match_chips(proc_ref, proc_target)
            t_total = (time.perf_counter() - t0) * 1000.0

            # Generate visual artifact
            vis_file = self.output_dir / f"loftr_robustness_scale_{s:.2f}x.png"
            draw_loftr_correspondence_result(
                proc_ref,
                proc_target,
                match_res["pts1"],
                match_res["pts2"],
                match_res["inlier_mask"],
                match_res,
                vis_file,
            )

            conf = match_res["confidence_stats"]
            trial = LoFTRRobustnessTrialResult(
                experiment_type="scale",
                parameter_name="scale_factor",
                parameter_value=s,
                label=f"[REAL DATA + CONTROLLED TRANSFORMATION] Scale {s:.2f}x",
                num_correspondences=match_res["num_correspondences"],
                confidence_min=conf["min"],
                confidence_max=conf["max"],
                confidence_mean=conf["mean"],
                confidence_median=conf["median"],
                ransac_inliers=match_res["inliers"],
                inlier_ratio_pct=match_res["inlier_ratio_pct"],
                reprojection_rmse_px=match_res["reprojection_rmse_px"],
                inference_time_ms=match_res["inference_time_ms"],
                processing_time_ms=t_total,
                visualization_path=str(vis_file.resolve()),
            )
            results.append(trial)

        return results

    def run_photometric_experiment(
        self,
        base_chip: np.ndarray,
        gamma_values: Optional[List[float]] = None,
        contrast_values: Optional[List[float]] = None,
    ) -> List[LoFTRRobustnessTrialResult]:
        """
        Experiment 2: Controlled Photometric Robustness (Gamma & Contrast).
        """
        if gamma_values is None:
            gamma_values = [0.5, 0.7, 1.0, 1.5, 2.0]
        if contrast_values is None:
            contrast_values = [0.5, 1.0, 1.5]

        results = []
        proc_ref = normalize_and_contrast_stretch(base_chip)

        # Gamma sweeps
        for g in gamma_values:
            t0 = time.perf_counter()
            photo_target = apply_photometric_variation(proc_ref, gamma=g, contrast_factor=1.0)
            match_res = self.engine.match_chips(proc_ref, photo_target)
            t_total = (time.perf_counter() - t0) * 1000.0

            vis_file = self.output_dir / f"loftr_robustness_photometric_gamma_{g:.2f}.png"
            draw_loftr_correspondence_result(
                proc_ref,
                photo_target,
                match_res["pts1"],
                match_res["pts2"],
                match_res["inlier_mask"],
                match_res,
                vis_file,
            )

            conf = match_res["confidence_stats"]
            trial = LoFTRRobustnessTrialResult(
                experiment_type="photometric",
                parameter_name="gamma",
                parameter_value=g,
                label=f"[REAL DATA + CONTROLLED TRANSFORMATION] Gamma {g:.2f}",
                num_correspondences=match_res["num_correspondences"],
                confidence_min=conf["min"],
                confidence_max=conf["max"],
                confidence_mean=conf["mean"],
                confidence_median=conf["median"],
                ransac_inliers=match_res["inliers"],
                inlier_ratio_pct=match_res["inlier_ratio_pct"],
                reprojection_rmse_px=match_res["reprojection_rmse_px"],
                inference_time_ms=match_res["inference_time_ms"],
                processing_time_ms=t_total,
                visualization_path=str(vis_file.resolve()),
            )
            results.append(trial)

        # Contrast sweeps
        for c in contrast_values:
            if c == 1.0:
                continue  # Skip duplicate baseline
            t0 = time.perf_counter()
            photo_target = apply_photometric_variation(proc_ref, gamma=1.0, contrast_factor=c)
            match_res = self.engine.match_chips(proc_ref, photo_target)
            t_total = (time.perf_counter() - t0) * 1000.0

            vis_file = self.output_dir / f"loftr_robustness_photometric_contrast_{c:.2f}x.png"
            draw_loftr_correspondence_result(
                proc_ref,
                photo_target,
                match_res["pts1"],
                match_res["pts2"],
                match_res["inlier_mask"],
                match_res,
                vis_file,
            )

            conf = match_res["confidence_stats"]
            trial = LoFTRRobustnessTrialResult(
                experiment_type="photometric",
                parameter_name="contrast",
                parameter_value=c,
                label=f"[REAL DATA + CONTROLLED TRANSFORMATION] Contrast {c:.2f}x",
                num_correspondences=match_res["num_correspondences"],
                confidence_min=conf["min"],
                confidence_max=conf["max"],
                confidence_mean=conf["mean"],
                confidence_median=conf["median"],
                ransac_inliers=match_res["inliers"],
                inlier_ratio_pct=match_res["inlier_ratio_pct"],
                reprojection_rmse_px=match_res["reprojection_rmse_px"],
                inference_time_ms=match_res["inference_time_ms"],
                processing_time_ms=t_total,
                visualization_path=str(vis_file.resolve()),
            )
            results.append(trial)

        return results

    def run_rotation_experiment(
        self,
        base_chip: np.ndarray,
        angles_deg: Optional[List[float]] = None,
    ) -> List[LoFTRRobustnessTrialResult]:
        """
        Experiment 3: Geometric Rotation Robustness (5°, 15°, 30°, 45°).
        """
        if angles_deg is None:
            angles_deg = [5.0, 15.0, 30.0, 45.0]

        results = []
        proc_ref = normalize_and_contrast_stretch(base_chip)

        for deg in angles_deg:
            t0 = time.perf_counter()
            rotated_target = apply_rotation(proc_ref, deg)
            match_res = self.engine.match_chips(proc_ref, rotated_target)
            t_total = (time.perf_counter() - t0) * 1000.0

            vis_file = self.output_dir / f"loftr_robustness_rotation_{deg:.1f}deg.png"
            draw_loftr_correspondence_result(
                proc_ref,
                rotated_target,
                match_res["pts1"],
                match_res["pts2"],
                match_res["inlier_mask"],
                match_res,
                vis_file,
            )

            conf = match_res["confidence_stats"]
            trial = LoFTRRobustnessTrialResult(
                experiment_type="rotation",
                parameter_name="angle_deg",
                parameter_value=deg,
                label=f"[REAL DATA + CONTROLLED TRANSFORMATION] Rotation {deg:.1f}°",
                num_correspondences=match_res["num_correspondences"],
                confidence_min=conf["min"],
                confidence_max=conf["max"],
                confidence_mean=conf["mean"],
                confidence_median=conf["median"],
                ransac_inliers=match_res["inliers"],
                inlier_ratio_pct=match_res["inlier_ratio_pct"],
                reprojection_rmse_px=match_res["reprojection_rmse_px"],
                inference_time_ms=match_res["inference_time_ms"],
                processing_time_ms=t_total,
                visualization_path=str(vis_file.resolve()),
            )
            results.append(trial)

        return results

    def run_full_benchmark(
        self,
        xml_path: str,
        chip_bounds: Optional[ChipRegion] = None,
        img_path: Optional[str] = None,
    ) -> LoFTRBenchmarkReport:
        """
        Run the complete LoFTR scientific robustness benchmark on real OHRC raster.
        """
        meta = parse_pds4_label(xml_path)
        if img_path is None:
            img_path = resolve_img_path(xml_path, meta)

        bounds = chip_bounds or ChipRegion(
            row_start=15000, row_end=16500, col_start=3000, col_end=4500
        )

        base_chip = read_chip(
            meta,
            row_start=bounds.row_start,
            row_end=bounds.row_end,
            col_start=bounds.col_start,
            col_end=bounds.col_end,
            img_path=img_path,
        )

        scale_res = self.run_scale_experiment(base_chip)
        photo_res = self.run_photometric_experiment(base_chip)
        rot_res = self.run_rotation_experiment(base_chip)

        return LoFTRBenchmarkReport(
            product_id=meta.product_id,
            chip_bounds=bounds,
            scale_trials=scale_res,
            photometric_trials=photo_res,
            rotation_trials=rot_res,
            device=str(self.engine.device),
            status=AnalysisStatus.COMPUTED,
        )

