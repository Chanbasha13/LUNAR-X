"""
Pydantic schemas for LUNAR-X backend API.

Every scientific result carries a `status` field:
  - COMPUTED        — algorithm ran successfully on real data
  - REFERENCE       — value extracted from PDS4 metadata (not computed)
  - AWAITING ANALYSIS — no real analysis has been performed yet
"""

from __future__ import annotations
from typing import List, Optional
from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Status constants
# ---------------------------------------------------------------------------
class AnalysisStatus:
    COMPUTED = "COMPUTED"
    REFERENCE = "REFERENCE"
    AWAITING = "AWAITING ANALYSIS"


# ---------------------------------------------------------------------------
# PDS4 metadata schemas
# ---------------------------------------------------------------------------
class ImageDimensions(BaseModel):
    lines: Optional[int] = None
    samples: Optional[int] = None
    bands: int = 1


class PDS4Metadata(BaseModel):
    """Parsed metadata from a PDS4 XML label."""

    # Identification
    product_id: str = Field(default="AWAITING ANALYSIS")
    title: str = Field(default="AWAITING ANALYSIS")

    # Instrument
    mission: str = Field(default="AWAITING ANALYSIS")
    spacecraft: str = Field(default="AWAITING ANALYSIS")
    instrument_name: str = Field(default="AWAITING ANALYSIS")
    instrument_type: str = Field(default="AWAITING ANALYSIS")
    target: str = Field(default="AWAITING ANALYSIS")

    # Processing
    processing_level: str = Field(default="AWAITING ANALYSIS")

    # Time
    start_time: str = Field(default="AWAITING ANALYSIS")
    stop_time: str = Field(default="AWAITING ANALYSIS")

    # Image structure
    dimensions: ImageDimensions = Field(default_factory=ImageDimensions)
    data_type: str = Field(default="AWAITING ANALYSIS")
    byte_order: str = Field(default="AWAITING ANALYSIS")
    offset_bytes: int = 0
    axis_index_order: str = Field(default="AWAITING ANALYSIS")

    # File
    img_filename: str = Field(default="AWAITING ANALYSIS")
    file_size_bytes: Optional[int] = None
    md5_checksum: str = Field(default="AWAITING ANALYSIS")

    # Observation parameters (ISDA-specific)
    orbit_number: Optional[int] = None
    pixel_resolution_m: Optional[float] = None
    solar_incidence_deg: Optional[float] = None
    sun_azimuth_deg: Optional[float] = None
    sun_elevation_deg: Optional[float] = None
    spacecraft_altitude_km: Optional[float] = None
    line_exposure_ms: Optional[float] = None
    focal_length_mm: Optional[float] = None
    tdi_stages: str = Field(default="AWAITING ANALYSIS")
    projection: str = Field(default="AWAITING ANALYSIS")
    area: str = Field(default="AWAITING ANALYSIS")

    # Geometry corners
    upper_left_lat: Optional[float] = None
    upper_left_lon: Optional[float] = None
    upper_right_lat: Optional[float] = None
    upper_right_lon: Optional[float] = None
    lower_left_lat: Optional[float] = None
    lower_left_lon: Optional[float] = None
    lower_right_lat: Optional[float] = None
    lower_right_lon: Optional[float] = None

    # Scaling (if present in XML)
    scaling_factor: Optional[float] = None
    offset_value: Optional[float] = None

    # Validation
    file_size_valid: Optional[bool] = None
    expected_size_bytes: Optional[int] = None

    # Status
    status: str = AnalysisStatus.AWAITING


class InspectionResponse(BaseModel):
    """Response from /api/pds4/inspect."""
    metadata: PDS4Metadata
    status: str
    message: str


# ---------------------------------------------------------------------------
# Preview schemas
# ---------------------------------------------------------------------------
class PreviewRequest(BaseModel):
    xml_path: str
    max_dimension: int = Field(default=2048, ge=256, le=8192)


class PreviewResponse(BaseModel):
    preview_path: str
    original_lines: int
    original_samples: int
    preview_height: int
    preview_width: int
    status: str
    message: str


# ---------------------------------------------------------------------------
# Chip & Region Selection Schemas
# ---------------------------------------------------------------------------
class ChipRegion(BaseModel):
    """Sub-region bounding box inside a raw PDS4 raster (0-indexed)."""
    row_start: int = Field(ge=0, description="Starting line (Y index)")
    row_end: int = Field(gt=0, description="Ending line (Y index)")
    col_start: int = Field(ge=0, description="Starting sample (X index)")
    col_end: int = Field(gt=0, description="Ending sample (X index)")


# ---------------------------------------------------------------------------
# Correspondence Engine Schemas
# ---------------------------------------------------------------------------
class MetricResult(BaseModel):
    """A single scientific metric with provenance tracking."""
    name: str
    value: Optional[str] = None
    unit: Optional[str] = None
    status: str = AnalysisStatus.AWAITING


class DetailedCorrespondenceMetrics(BaseModel):
    """Detailed algorithmic metrics computed by classical SIFT/RANSAC pipeline."""
    keypoints_img1: Optional[int] = None
    keypoints_img2: Optional[int] = None
    raw_matches: Optional[int] = None
    good_matches: Optional[int] = None
    ransac_inliers: Optional[int] = None
    inlier_ratio_pct: Optional[float] = None
    reprojection_rmse_px: Optional[float] = None
    transformation_matrix: Optional[List[List[float]]] = None
    processing_time_ms: Optional[float] = None
    visualization_path: Optional[str] = None
    visualization_url: Optional[str] = None
    chip_a_bounds: Optional[ChipRegion] = None
    chip_b_bounds: Optional[ChipRegion] = None
    status: str = AnalysisStatus.AWAITING


class CorrespondenceResult(BaseModel):
    """Full correspondence analysis output."""
    latitude: MetricResult = Field(
        default_factory=lambda: MetricResult(name="Latitude", unit="°")
    )
    longitude: MetricResult = Field(
        default_factory=lambda: MetricResult(name="Longitude", unit="°")
    )
    dense_correspondences: MetricResult = Field(
        default_factory=lambda: MetricResult(
            name="Dense Correspondences", unit="points"
        )
    )
    subpixel_rmse: MetricResult = Field(
        default_factory=lambda: MetricResult(name="Sub-pixel RMSE", unit="px")
    )
    ransac_inlier_ratio: MetricResult = Field(
        default_factory=lambda: MetricResult(
            name="RANSAC Inlier Ratio", unit="%"
        )
    )
    sun_angle_variance: MetricResult = Field(
        default_factory=lambda: MetricResult(
            name="Sun-Angle Variance", unit="°"
        )
    )
    elevation_profile: MetricResult = Field(
        default_factory=lambda: MetricResult(name="Elevation Profile")
    )
    feature_method: str = Field(default="AWAITING ANALYSIS")
    detailed_metrics: Optional[DetailedCorrespondenceMetrics] = None
    status: str = AnalysisStatus.AWAITING
    message: str = "No correspondence analysis has been executed."


# ---------------------------------------------------------------------------
# Robustness Benchmarking Schemas
# ---------------------------------------------------------------------------
class RobustnessTrialResult(BaseModel):
    """Result of a single controlled transformation test."""
    experiment_type: str = Field(description="scale | rotation | photometric")
    parameter_name: str
    parameter_value: float
    label: str
    keypoints_ref: int
    keypoints_trans: int
    raw_matches: int
    good_matches: int
    ransac_inliers: int
    inlier_ratio_pct: float
    reprojection_rmse_px: Optional[float] = None
    processing_time_ms: float
    visualization_path: Optional[str] = None
    visualization_url: Optional[str] = None
    status: str = AnalysisStatus.COMPUTED


class RobustnessBenchmarkReport(BaseModel):
    """Full benchmark suite evaluation across controlled transformations."""
    product_id: str
    chip_bounds: ChipRegion
    scale_trials: List[RobustnessTrialResult]
    rotation_trials: List[RobustnessTrialResult]
    photometric_trials: List[RobustnessTrialResult]
    summary_notes: str
    status: str = AnalysisStatus.COMPUTED


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
