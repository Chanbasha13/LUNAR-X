"""
Non-destructive Preview Generation and Preprocessing for Chandrayaan-2 OHRC.

Reads real scientific imagery through memory mapping, downsamples without
mutating source data, applies robust contrast enhancement (percentile-based stretch),
and exports web-ready PNG previews to backend/data/previews/.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional, Tuple, Union
import cv2
import numpy as np

from app.models.schemas import PDS4Metadata, PreviewResponse, AnalysisStatus
from app.services.pds4_reader import parse_pds4_label
from app.services.image_loader import get_memmap, resolve_img_path


# Target directory for generated web previews
DEFAULT_PREVIEW_DIR = Path(__file__).resolve().parents[2] / "data" / "previews"


def normalize_and_contrast_stretch(
    data: np.ndarray,
    p_low: float = 1.0,
    p_high: float = 99.0,
) -> np.ndarray:
    """
    Apply percentile-based contrast stretching to map raw planetary DN values
    into a high-contrast 8-bit grayscale image [0, 255].

    Parameters
    ----------
    data : np.ndarray
        Input 2D numpy array.
    p_low : float
        Lower percentile (default 1.0%).
    p_high : float
        Upper percentile (default 99.0%).

    Returns
    -------
    np.ndarray
        8-bit unsigned integer array [0, 255].
    """
    if data.size == 0:
        return data.astype(np.uint8)

    # Compute bounds from non-zero valid pixels if possible
    valid_mask = data > 0
    if np.any(valid_mask):
        val_sample = data[valid_mask]
        low_val = np.percentile(val_sample, p_low)
        high_val = np.percentile(val_sample, p_high)
    else:
        low_val = np.percentile(data, p_low)
        high_val = np.percentile(data, p_high)

    if high_val <= low_val:
        # Flat image fallback
        return np.clip(data, 0, 255).astype(np.uint8)

    # Linear stretch to 0-255
    stretched = np.clip((data - low_val) / (high_val - low_val) * 255.0, 0, 255)
    return stretched.astype(np.uint8)


def generate_web_preview(
    xml_or_meta: Union[str, PDS4Metadata],
    output_dir: Optional[Union[str, Path]] = None,
    max_dimension: int = 2048,
    img_path: Optional[str] = None,
    filename_suffix: str = "preview",
) -> PreviewResponse:
    """
    Generate a non-destructive web preview from real PDS4 scientific raster.

    The original .IMG is accessed purely in read-only mode.
    Downsampling is performed via strided sampling from the memory map to
    prevent high RAM allocation, then resized smoothly using OpenCV.

    Parameters
    ----------
    xml_or_meta : Union[str, PDS4Metadata]
        Path to PDS4 XML label or parsed metadata.
    output_dir : Optional[Union[str, Path]]
        Destination directory for preview (defaults to backend/data/previews/).
    max_dimension : int
        Maximum size along the longer axis of the generated preview (default 2048).
    img_path : Optional[str]
        Direct path to .img file if known.
    filename_suffix : str
        Suffix for output filename.

    Returns
    -------
    PreviewResponse
        Details of generated preview including path and dimensions.
    """
    if isinstance(xml_or_meta, str):
        xml_path = xml_or_meta
        meta = parse_pds4_label(xml_path)
    else:
        meta = xml_or_meta
        xml_path = None

    if img_path is None and xml_path is not None:
        img_path = resolve_img_path(xml_path, meta)

    out_dir = Path(output_dir) if output_dir else DEFAULT_PREVIEW_DIR
    out_dir.mkdir(parents=True, exist_ok=True)

    # Open read-only memmap
    mmap = get_memmap(meta, img_path=img_path)
    orig_lines, orig_samples = mmap.shape

    # Calculate integer stride to get a manageable intermediate array
    # e.g. for 91971 x 12000, target max_dimension 2048 -> stride ~45
    long_axis = max(orig_lines, orig_samples)
    stride = max(1, long_axis // (max_dimension * 2))

    # Read strided slice (e.g. ~2000 x 266 pixels in RAM = ~500 KB)
    strided_raw = np.array(mmap[::stride, ::stride], copy=True)

    # Enhance contrast
    stretched_8bit = normalize_and_contrast_stretch(strided_raw, p_low=1.0, p_high=99.0)

    # Final resize to exact target bounding box preserving aspect ratio
    cur_h, cur_w = stretched_8bit.shape
    scale = min(max_dimension / max(cur_h, 1), max_dimension / max(cur_w, 1), 1.0)
    final_w = max(1, int(round(cur_w * scale)))
    final_h = max(1, int(round(cur_h * scale)))

    if (final_w, final_h) != (cur_w, cur_h):
        resized = cv2.resize(
            stretched_8bit, (final_w, final_h), interpolation=cv2.INTER_AREA
        )
    else:
        resized = stretched_8bit

    # Output filename
    stem = Path(meta.img_filename).stem if meta.img_filename != "AWAITING ANALYSIS" else "lunar_product"
    out_file = out_dir / f"{stem}_{filename_suffix}.png"

    # Save PNG
    success = cv2.imwrite(str(out_file), resized)
    if not success:
        raise IOError(f"Failed to write preview image to: {out_file}")

    return PreviewResponse(
        preview_path=str(out_file.resolve()),
        original_lines=orig_lines,
        original_samples=orig_samples,
        preview_height=final_h,
        preview_width=final_w,
        status=AnalysisStatus.COMPUTED,
        message=f"Non-destructive preview successfully generated ({final_w}x{final_h} px from {orig_samples}x{orig_lines} px original).",
    )

