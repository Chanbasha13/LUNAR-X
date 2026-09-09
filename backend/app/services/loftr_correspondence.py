"""
Real LoFTR Correspondence Engine for LUNAR-X (SIH26166).

Integrates the authentic Deep Learned Local Feature Transformer (LoFTR)
from Kornia with Apple MPS hardware acceleration to predict dense feature
correspondences on real Chandrayaan-2 OHRC lunar regolith chips.

Guarantees:
- Never loads the 1.03 GB PDS4 raster into RAM (uses memory mapping).
- Operates on real unmutated scientific imagery.
- Rescales predicted keypoint coordinates back to original resolution.
- Validates correspondences via robust geometric RANSAC estimation.
- Computes exact reprojection RMSE and confidence distribution statistics.
"""

from __future__ import annotations

import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union
import cv2
import numpy as np
import torch

from app.models.schemas import (
    AnalysisStatus,
    ChipRegion,
    CorrespondenceResult,
    DetailedCorrespondenceMetrics,
    MetricResult,
    PDS4Metadata,
)
from app.services.correspondence_engine import (
    compute_reprojection_rmse,
    validate_chip_bounds,
)
from app.services.image_loader import get_memmap, read_chip, resolve_img_path
from app.services.pds4_reader import parse_pds4_label
from app.services.preprocessing import normalize_and_contrast_stretch

# Directory for storing LoFTR correspondence visualizations
DEFAULT_LOFTR_RESULTS_DIR = Path(__file__).resolve().parents[2] / "data" / "results" / "loftr"
DEFAULT_CHECKPOINT_DIR = Path("/Volumes/Ali/.cache/torch/hub/checkpoints")


class LoFTRCorrespondenceEngine:
    """
    Authentic LoFTR Correspondence Engine with MPS acceleration and RANSAC validation.
    """

    def __init__(
        self,
        pretrained: str = "outdoor",
        target_dimension: int = 640,
        ransac_threshold: float = 3.0,
        device: Optional[str] = None,
    ):
        self.pretrained = pretrained
        self.target_dimension = target_dimension  # Must be divisible by 8 (e.g. 640)
        self.ransac_threshold = ransac_threshold

        # Device selection: MPS -> CPU
        if device is not None:
            self.device = torch.device(device)
        elif torch.backends.mps.is_available():
            self.device = torch.device("mps")
        else:
            self.device = torch.device("cpu")

        self._model = None

    def _get_model(self):
        """
        Lazy-load LoFTR model onto selected device.
        """
        if self._model is None:
            from kornia.feature import LoFTR

            # Point torch home to /Volumes/Ali cache if present
            if Path("/Volumes/Ali/.cache/torch").is_dir():
                os.environ["TORCH_HOME"] = "/Volumes/Ali/.cache/torch"

            model = LoFTR(pretrained=self.pretrained)
            self._model = model.to(self.device).eval()
        return self._model

    def prepare_tensors(
        self,
        img1: np.ndarray,
        img2: np.ndarray,
    ) -> Tuple[torch.Tensor, torch.Tensor, float, float, float, float]:
        """
        Preprocess image chips into normalized LoFTR input tensors (1, 1, H_model, W_model)
        and compute coordinate scale factors for mapping back to original pixel dimensions.
        """
        h1, w1 = img1.shape[:2]
        h2, w2 = img2.shape[:2]

        target_h, target_w = self.target_dimension, self.target_dimension

        scale_x1 = w1 / float(target_w)
        scale_y1 = h1 / float(target_h)
        scale_x2 = w2 / float(target_w)
        scale_y2 = h2 / float(target_h)

        res1 = cv2.resize(img1, (target_w, target_h), interpolation=cv2.INTER_AREA)
        res2 = cv2.resize(img2, (target_w, target_h), interpolation=cv2.INTER_AREA)

        t1 = torch.from_numpy(res1).float().unsqueeze(0).unsqueeze(0).to(self.device) / 255.0
        t2 = torch.from_numpy(res2).float().unsqueeze(0).unsqueeze(0).to(self.device) / 255.0

        return t1, t2, scale_x1, scale_y1, scale_x2, scale_y2

    def match_chips(
        self,
        img1: np.ndarray,
        img2: np.ndarray,
    ) -> Dict[str, Any]:
        """
        Execute LoFTR correspondence prediction on a pair of preprocessed image chips.
        """
        model = self._get_model()

        t1, t2, sx1, sy1, sx2, sy2 = self.prepare_tensors(img1, img2)

        t_start = time.perf_counter()
        with torch.no_grad():
            out = model({"image0": t1, "image1": t2})
        t_inference = (time.perf_counter() - t_start) * 1000.0

        kpts0_raw = out["keypoints0"].cpu().numpy()
        kpts1_raw = out["keypoints1"].cpu().numpy()
        confidence = out["confidence"].cpu().numpy()

        num_corresp = len(kpts0_raw)

        if num_corresp == 0:
            return {
                "num_correspondences": 0,
                "confidence_stats": {
                    "min": 0.0,
                    "max": 0.0,
                    "mean": 0.0,
                    "median": 0.0,
                },
                "pts1": np.empty((0, 2), dtype=np.float32),
                "pts2": np.empty((0, 2), dtype=np.float32),
                "confidence": np.empty(0, dtype=np.float32),
                "inliers": 0,
                "inlier_ratio_pct": 0.0,
                "reprojection_rmse_px": None,
                "homography": None,
                "inlier_mask": None,
                "inference_time_ms": t_inference,
                "device": str(self.device),
            }

        # Rescale coordinates to original chip dimensions
        pts1 = kpts0_raw.copy()
        pts2 = kpts1_raw.copy()
        pts1[:, 0] *= sx1
        pts1[:, 1] *= sy1
        pts2[:, 0] *= sx2
        pts2[:, 1] *= sy2

        # Validate coordinate bounds
        h1, w1 = img1.shape[:2]
        h2, w2 = img2.shape[:2]
        valid_mask = (
            (pts1[:, 0] >= 0) & (pts1[:, 0] < w1) &
            (pts1[:, 1] >= 0) & (pts1[:, 1] < h1) &
            (pts2[:, 0] >= 0) & (pts2[:, 0] < w2) &
            (pts2[:, 1] >= 0) & (pts2[:, 1] < h2) &
            ~np.isnan(pts1).any(axis=1) &
            ~np.isnan(pts2).any(axis=1)
        )

        pts1 = pts1[valid_mask]
        pts2 = pts2[valid_mask]
        confidence = confidence[valid_mask]
        num_corresp = len(pts1)

        # Robust Geometric Estimation via RANSAC
        inliers = 0
        inlier_ratio = 0.0
        rmse = None
        H = None
        inlier_mask = None

        if num_corresp >= 4:
            H, mask = cv2.findHomography(pts1, pts2, cv2.RANSAC, self.ransac_threshold)
            if mask is not None:
                inlier_mask = mask.ravel() == 1
                inliers = int(np.sum(inlier_mask))
                inlier_ratio = (inliers / float(num_corresp)) * 100.0
                if inliers > 0 and H is not None:
                    src_inliers = pts1[inlier_mask]
                    dst_inliers = pts2[inlier_mask]
                    rmse = compute_reprojection_rmse(src_inliers, dst_inliers, H)

        conf_stats = {
            "min": float(np.min(confidence)) if num_corresp > 0 else 0.0,
            "max": float(np.max(confidence)) if num_corresp > 0 else 0.0,
            "mean": float(np.mean(confidence)) if num_corresp > 0 else 0.0,
            "median": float(np.median(confidence)) if num_corresp > 0 else 0.0,
        }

        return {
            "num_correspondences": num_corresp,
            "confidence_stats": conf_stats,
            "pts1": pts1,
            "pts2": pts2,
            "confidence": confidence,
            "inliers": inliers,
            "inlier_ratio_pct": inlier_ratio,
            "reprojection_rmse_px": rmse,
            "homography": H,
            "inlier_mask": inlier_mask,
            "inference_time_ms": t_inference,
            "device": str(self.device),
        }


def draw_loftr_correspondence_result(
    img1: np.ndarray,
    img2: np.ndarray,
    pts1: np.ndarray,
    pts2: np.ndarray,
    inlier_mask: Optional[np.ndarray],
    metrics: Dict[str, Any],
    output_path: Union[str, Path],
    max_lines_to_draw: int = 150,
) -> Path:
    """
    Generate a high-resolution, scientifically readable side-by-side
    correspondence visualization of LoFTR deep features.
    """
    out_file = Path(output_path)
    out_file.parent.mkdir(parents=True, exist_ok=True)

    # Convert grayscale to BGR for color overlays
    c1 = cv2.cvtColor(img1, cv2.COLOR_GRAY2BGR) if len(img1.shape) == 2 else img1.copy()
    c2 = cv2.cvtColor(img2, cv2.COLOR_GRAY2BGR) if len(img2.shape) == 2 else img2.copy()

    h1, w1 = c1.shape[:2]
    h2, w2 = c2.shape[:2]
    canvas_h = max(h1, h2)
    canvas_w = w1 + w2

    canvas = np.zeros((canvas_h, canvas_w, 3), dtype=np.uint8)
    canvas[:h1, :w1] = c1
    canvas[:h2, w1:w1 + w2] = c2

    num_pts = len(pts1)
    if num_pts > 0:
        # Uniformly sample lines for visual clarity
        step = max(1, num_pts // max_lines_to_draw)
        indices = np.arange(0, num_pts, step)

        for idx in indices:
            p1 = (int(round(pts1[idx, 0])), int(round(pts1[idx, 1])))
            p2 = (int(round(pts2[idx, 0])) + w1, int(round(pts2[idx, 1])))

            is_inlier = inlier_mask[idx] if inlier_mask is not None and idx < len(inlier_mask) else True
            color = (0, 255, 0) if is_inlier else (0, 0, 255)  # Green for inlier, Red for outlier

            cv2.circle(canvas, p1, 3, (0, 255, 255), -1)  # Yellow point on Img 1
            cv2.circle(canvas, p2, 3, (0, 255, 255), -1)  # Yellow point on Img 2
            cv2.line(canvas, p1, p2, color, 1, cv2.LINE_AA)

    # Draw header information banner
    banner_h = 75
    banner = np.zeros((banner_h, canvas_w, 3), dtype=np.uint8)
    banner[:] = (20, 20, 24)

    corresp = metrics.get("num_correspondences", 0)
    inliers = metrics.get("inliers", 0)
    ratio = metrics.get("inlier_ratio_pct", 0.0)
    rmse = metrics.get("reprojection_rmse_px")
    rmse_str = f"{rmse:.4f} px" if rmse is not None else "N/A"
    inf_time = metrics.get("inference_time_ms", 0.0)
    device_str = metrics.get("device", "mps")
    conf_mean = metrics.get("confidence_stats", {}).get("mean", 0.0)

    title_text = f"LUNAR-X [LoFTR TRANSFORMER] REAL OHRC CORRESPONDENCE | Hardware: {device_str}"
    metrics_text = (
        f"Correspondences: {corresp:,} | RANSAC Inliers: {inliers:,} ({ratio:.1f}%) | "
        f"RMSE: {rmse_str} | Mean Conf: {conf_mean:.4f} | Inference: {inf_time:.1f}ms [COMPUTED]"
    )

    cv2.putText(banner, title_text, (15, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 255), 2, cv2.LINE_AA)
    cv2.putText(banner, metrics_text, (15, 56), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (200, 200, 200), 1, cv2.LINE_AA)

    final_img = np.vstack([banner, canvas])
    cv2.imwrite(str(out_file), final_img)
    return out_file

