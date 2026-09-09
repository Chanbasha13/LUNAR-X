"""
Memory-safe Image Loader for Chandrayaan-2 OHRC products.

Uses numpy.memmap in READ-ONLY mode to interact with large PDS4 IMG files
without loading the entire raster (~1.1 GB) into memory.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional, Tuple, Union
import numpy as np

from app.models.schemas import PDS4Metadata
from app.services.pds4_reader import parse_pds4_label

# Map PDS4 data_type to numpy dtype
PDS4_DTYPE_MAP = {
    "UnsignedByte": np.dtype("uint8"),
    "SignedByte": np.dtype("int8"),
    "UnsignedLSB2": np.dtype("<u2"),
    "SignedLSB2": np.dtype("<i2"),
    "UnsignedMSB2": np.dtype(">u2"),
    "SignedMSB2": np.dtype(">i2"),
    "UnsignedLSB4": np.dtype("<u4"),
    "SignedLSB4": np.dtype("<i4"),
    "UnsignedMSB4": np.dtype(">u4"),
    "SignedMSB4": np.dtype(">i4"),
    "IEEE754LSBSingle": np.dtype("<f4"),
    "IEEE754MSBSingle": np.dtype(">f4"),
    "IEEE754LSBDouble": np.dtype("<f8"),
    "IEEE754MSBDouble": np.dtype(">f8"),
}


def resolve_img_path(xml_path: str, meta: Optional[PDS4Metadata] = None) -> str:
    """
    Locate the .img file corresponding to a PDS4 XML label.
    """
    if meta is None:
        meta = parse_pds4_label(xml_path)

    xml_dir = Path(xml_path).parent
    img_filename = meta.img_filename

    if img_filename and img_filename != "AWAITING ANALYSIS":
        direct_path = xml_dir / img_filename
        if direct_path.is_file():
            return str(direct_path)

    # Fallback search for any .img with matching stem in the same folder
    xml_stem = Path(xml_path).stem
    candidate = xml_dir / f"{xml_stem}.img"
    if candidate.is_file():
        return str(candidate)

    # Search for uppercase .IMG
    candidate_upper = xml_dir / f"{xml_stem}.IMG"
    if candidate_upper.is_file():
        return str(candidate_upper)

    raise FileNotFoundError(f"Associated IMG file not found for label: {xml_path}")


def get_numpy_dtype(meta: PDS4Metadata) -> np.dtype:
    """
    Resolve numpy dtype from PDS4 metadata.
    """
    dtype = PDS4_DTYPE_MAP.get(meta.data_type)
    if dtype is None:
        raise ValueError(
            f"Unsupported or missing PDS4 data_type: {meta.data_type}. "
            f"Cannot safely interpret raw bytes."
        )
    return dtype


def get_memmap(
    xml_or_meta: Union[str, PDS4Metadata],
    img_path: Optional[str] = None,
) -> np.memmap:
    """
    Open the scientific IMG raster as a read-only numpy.memmap.

    The original scientific file is NEVER opened for writing (mode='r').
    The data remains on disk; only requested virtual pages are loaded by the OS.

    Parameters
    ----------
    xml_or_meta : Union[str, PDS4Metadata]
        Path to PDS4 XML label or already parsed PDS4Metadata.
    img_path : Optional[str]
        Optional direct path to .img file. If omitted, resolved from XML.

    Returns
    -------
    np.memmap
        2D memory-mapped array of shape (lines, samples) with exact PDS4 dtype.
    """
    if isinstance(xml_or_meta, str):
        xml_path = xml_or_meta
        meta = parse_pds4_label(xml_path)
    else:
        meta = xml_or_meta
        xml_path = None

    if img_path is None:
        if xml_path is None:
            raise ValueError("Must provide xml_path or direct img_path.")
        img_path = resolve_img_path(xml_path, meta)

    lines = meta.dimensions.lines
    samples = meta.dimensions.samples

    if lines is None or samples is None:
        raise ValueError(
            f"Invalid image dimensions in metadata: lines={lines}, samples={samples}"
        )

    dtype = get_numpy_dtype(meta)
    offset = meta.offset_bytes

    # Open strictly in read-only mode to prevent any file modification
    mmap = np.memmap(
        img_path,
        dtype=dtype,
        mode="r",
        offset=offset,
        shape=(lines, samples),
        order="C",
    )
    return mmap


def read_chip(
    xml_or_meta: Union[str, PDS4Metadata],
    row_start: int,
    row_end: int,
    col_start: int,
    col_end: int,
    img_path: Optional[str] = None,
) -> np.ndarray:
    """
    Safely extract a sub-region (chip) from the scientific image.

    Parameters
    ----------
    xml_or_meta : Union[str, PDS4Metadata]
        PDS4 XML path or metadata object.
    row_start, row_end : int
        Row (line) slice bounds.
    col_start, col_end : int
        Column (sample) slice bounds.

    Returns
    -------
    np.ndarray
        Copied array slice in memory.
    """
    mmap = get_memmap(xml_or_meta, img_path=img_path)
    lines, samples = mmap.shape

    # Clamp bounds safely
    r0 = max(0, min(row_start, lines))
    r1 = max(0, min(row_end, lines))
    c0 = max(0, min(col_start, samples))
    c1 = max(0, min(col_end, samples))

    if r1 <= r0 or c1 <= c0:
        raise ValueError(f"Invalid chip bounds: rows [{r0}:{r1}], cols [{c0}:{c1}]")

    # Read slice and return an in-memory copy
    chip = np.array(mmap[r0:r1, c0:c1], copy=True)
    return chip


def compute_sparse_statistics(
    xml_or_meta: Union[str, PDS4Metadata],
    sample_step: int = 100,
    img_path: Optional[str] = None,
) -> dict:
    """
    Compute distribution statistics (min, max, mean, std, percentiles)
    using sparse strided sampling without loading the full raster into RAM.
    """
    mmap = get_memmap(xml_or_meta, img_path=img_path)
    # Strided slice loads only selected memory pages
    sample = np.array(mmap[::sample_step, ::sample_step], copy=True)

    return {
        "min": float(np.min(sample)),
        "max": float(np.max(sample)),
        "mean": float(np.mean(sample)),
        "std": float(np.std(sample)),
        "p1": float(np.percentile(sample, 1)),
        "p5": float(np.percentile(sample, 5)),
        "p95": float(np.percentile(sample, 95)),
        "p99": float(np.percentile(sample, 99)),
        "samples_evaluated": int(sample.size),
    }

