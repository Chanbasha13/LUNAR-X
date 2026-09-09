"""
LUNAR-X Scientific Registration Improvement Experimentation Harness.

Systematically evaluates scale-aware preprocessing, illumination normalization,
coarse-to-fine registration, multi-hypothesis matching, and robust geometric
estimation on real Chandrayaan-2 OHRC (0.25m/px) and TMC-2 (4.80m/px) data.
"""

from __future__ import annotations

import csv
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
import torch

from app.services.correspondence_engine import compute_reprojection_rmse
from app.services.loftr_correspondence import LoFTRCorrespondenceEngine

# Output directory for new experimental results
RESULTS_DIR = Path(__file__).resolve().parents[2] / "data" / "results" / "improved_registration"
RESULTS_DIR.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Preprocessing Transforms
# ---------------------------------------------------------------------------
def apply_percentile_stretch(img: np.ndarray, low_p: float = 1.0, high_p: float = 99.0) -> np.ndarray:
    """Standard percentile contrast stretching."""
    v_min, v_max = np.percentile(img, (low_p, high_p))
    if v_max <= v_min:
        return img.copy()
    stretched = np.clip((img.astype(np.float32) - v_min) / (v_max - v_min) * 255.0, 0, 255).astype(np.uint8)
    return stretched


def apply_clahe(img: np.ndarray, clip_limit: float = 2.0, tile_grid_size: Tuple[int, int] = (8, 8)) -> np.ndarray:
    """Contrast Limited Adaptive Histogram Equalization."""
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    return clahe.apply(img)


def apply_local_contrast_normalization(img: np.ndarray, sigma: float = 5.0) -> np.ndarray:
    """Local Contrast Normalization / Bandpass filtering (I - Gaussian(I))."""
    blur = cv2.GaussianBlur(img.astype(np.float32), (0, 0), sigmaX=sigma, sigmaY=sigma)
    hp = img.astype(np.float32) - blur
    norm = np.clip(hp * 2.0 + 128.0, 0, 255).astype(np.uint8)
    return norm


def apply_gradient_magnitude(img: np.ndarray) -> np.ndarray:
    """Sobel gradient magnitude representation."""
    gx = cv2.Sobel(img, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(img, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.hypot(gx, gy)
    mag_norm = np.clip(mag / (mag.max() + 1e-6) * 255.0, 0, 255).astype(np.uint8)
    return mag_norm


def apply_morphological_crater_filter(img: np.ndarray, kernel_size: int = 7) -> np.ndarray:
    """Top-hat + Black-hat morphological filter for crater rim isolation."""
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (kernel_size, kernel_size))
    tophat = cv2.morphologyEx(img, cv2.MORPH_TOPHAT, kernel)
    blackhat = cv2.morphologyEx(img, cv2.MORPH_BLACKHAT, kernel)
    combined = cv2.add(img, cv2.subtract(tophat, blackhat))
    return combined


def apply_homomorphic_filter(img: np.ndarray, d0: float = 30.0, gamma_l: float = 0.5, gamma_h: float = 1.5) -> np.ndarray:
    """Homomorphic filter in frequency domain for illumination-reflectance separation."""
    rows, cols = img.shape
    img_log = np.log1p(img.astype(np.float32))
    
    dft = np.fft.fft2(img_log)
    dft_shift = np.fft.fftshift(dft)
    
    u = np.arange(rows) - rows / 2
    v = np.arange(cols) - cols / 2
    U, V = np.meshgrid(v, u)
    D = np.sqrt(U**2 + V**2)
    
    H = (gamma_h - gamma_l) * (1.0 - np.exp(-(D**2) / (2 * (d0**2)))) + gamma_l
    
    filtered_dft = dft_shift * H
    filtered_ishift = np.fft.ifftshift(filtered_dft)
    img_back = np.fft.ifft2(filtered_ishift)
    img_exp = np.expm1(np.real(img_back))
    
    return apply_percentile_stretch(img_exp)


# ---------------------------------------------------------------------------
# Geometric Estimation Helper
# ---------------------------------------------------------------------------
def evaluate_geometric_consistency(
    pts1: np.ndarray,
    pts2: np.ndarray,
    model_type: str = "homography_ransac",
    threshold: float = 5.0,
    max_iters: int = 5000,
    confidence: float = 0.99,
) -> Tuple[int, float, Optional[float], Optional[np.ndarray], Optional[np.ndarray]]:
    """
    Evaluates geometric consistency using specified transformation model and RANSAC variant.
    
    Returns: (inliers, inlier_ratio_pct, rmse_px, transform_matrix, inlier_mask)
    """
    n_pts = len(pts1)
    if n_pts < 4:
        return 0, 0.0, None, None, None

    H = None
    mask = None

    if model_type == "homography_ransac":
        H, mask = cv2.findHomography(pts1, pts2, cv2.RANSAC, threshold, maxIters=max_iters, confidence=confidence)
    elif model_type == "homography_magsac":
        H, mask = cv2.findHomography(pts1, pts2, cv2.USAC_MAGSAC, threshold, maxIters=max_iters, confidence=confidence)
    elif model_type == "affine_partial":
        H, inliers_arr = cv2.estimateAffinePartial2D(pts1, pts2, method=cv2.RANSAC, ransacReprojThreshold=threshold, maxIters=max_iters, confidence=confidence)
        if inliers_arr is not None:
            mask = inliers_arr
            if H is not None:
                H_3x3 = np.eye(3, dtype=np.float64)
                H_3x3[:2, :] = H
                H = H_3x3
    elif model_type == "affine_full":
        H, inliers_arr = cv2.estimateAffine2D(pts1, pts2, method=cv2.RANSAC, ransacReprojThreshold=threshold, maxIters=max_iters, confidence=confidence)
        if inliers_arr is not None:
            mask = inliers_arr
            if H is not None:
                H_3x3 = np.eye(3, dtype=np.float64)
                H_3x3[:2, :] = H
                H = H_3x3

    if mask is None or H is None:
        return 0, 0.0, None, None, None

    inlier_mask = mask.ravel() == 1
    inliers = int(np.sum(inlier_mask))
    inlier_ratio = (inliers / float(n_pts)) * 100.0 if n_pts > 0 else 0.0
    rmse = None

    if inliers >= 4:
        src_inliers = pts1[inlier_mask]
        dst_inliers = pts2[inlier_mask]
        rmse = compute_reprojection_rmse(src_inliers, dst_inliers, H)

    return inliers, inlier_ratio, rmse, H, inlier_mask


# ---------------------------------------------------------------------------
# SIFT Matching Helper
# ---------------------------------------------------------------------------
def run_sift_matching(
    img1: np.ndarray,
    img2: np.ndarray,
    n_features: int = 5000,
    ratio_threshold: float = 0.75,
    model_type: str = "homography_ransac",
    ransac_threshold: float = 5.0,
) -> Dict[str, Any]:
    """Execute SIFT keypoint detection and matching."""
    sift = cv2.SIFT_create(nfeatures=n_features)
    kp1, des1 = sift.detectAndCompute(img1, None)
    kp2, des2 = sift.detectAndCompute(img2, None)

    good_matches = []
    if des1 is not None and des2 is not None and len(des1) >= 2 and len(des2) >= 2:
        bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=False)
        knn = bf.knnMatch(des1, des2, k=2)
        good_matches = [m[0] for m in knn if len(m) == 2 and m[0].distance < ratio_threshold * m[1].distance]

    n_matches = len(good_matches)
    if n_matches < 4:
        return {
            "correspondences": n_matches,
            "inliers": 0,
            "inlier_ratio_pct": 0.0,
            "rmse_px": None,
            "mean_confidence": 0.0,
        }

    pts1 = np.float32([kp1[m.queryIdx].pt for m in good_matches]).reshape(-1, 2)
    pts2 = np.float32([kp2[m.trainIdx].pt for m in good_matches]).reshape(-1, 2)

    inliers, inlier_ratio, rmse, H, inlier_mask = evaluate_geometric_consistency(
        pts1, pts2, model_type=model_type, threshold=ransac_threshold
    )

    return {
        "correspondences": n_matches,
        "inliers": inliers,
        "inlier_ratio_pct": inlier_ratio,
        "rmse_px": rmse,
        "mean_confidence": float(1.0 - (np.mean([m.distance for m in good_matches]) / 500.0)) if n_matches > 0 else 0.0,
    }


# ---------------------------------------------------------------------------
# LoFTR Raw Matching Helper
# ---------------------------------------------------------------------------
def run_loftr_raw(
    engine: LoFTRCorrespondenceEngine,
    img1: np.ndarray,
    img2: np.ndarray,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray, float]:
    """
    Runs LoFTR inference on preprocessed images and returns raw predicted keypoints
    in each image's native pixel coordinates along with confidence scores and inference time.
    """
    model = engine._get_model()
    t1, t2, sx1, sy1, sx2, sy2 = engine.prepare_tensors(img1, img2)

    t_start = time.perf_counter()
    with torch.no_grad():
        out = model({"image0": t1, "image1": t2})
    t_inf = (time.perf_counter() - t_start) * 1000.0

    kpts0_raw = out["keypoints0"].cpu().numpy()
    kpts1_raw = out["keypoints1"].cpu().numpy()
    conf = out["confidence"].cpu().numpy()

    if len(kpts0_raw) == 0:
        return np.empty((0, 2), dtype=np.float32), np.empty((0, 2), dtype=np.float32), np.empty(0, dtype=np.float32), t_inf

    pts1 = kpts0_raw.copy()
    pts2 = kpts1_raw.copy()
    pts1[:, 0] *= sx1
    pts1[:, 1] *= sy1
    pts2[:, 0] *= sx2
    pts2[:, 1] *= sy2

    h1, w1 = img1.shape[:2]
    h2, w2 = img2.shape[:2]
    valid = (
        (pts1[:, 0] >= 0) & (pts1[:, 0] < w1) &
        (pts1[:, 1] >= 0) & (pts1[:, 1] < h1) &
        (pts2[:, 0] >= 0) & (pts2[:, 0] < w2) &
        (pts2[:, 1] >= 0) & (pts2[:, 1] < h2) &
        ~np.isnan(pts1).any(axis=1) &
        ~np.isnan(pts2).any(axis=1)
    )

    return pts1[valid], pts2[valid], conf[valid], t_inf
