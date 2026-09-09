"""
Unit and integration tests for official PDS4 Ground Coordinate Grid mapping (Phase 7E).
"""

import pytest
import numpy as np
from pathlib import Path
from app.services.geometry_mapper import GroundCoordinateGrid, CrossSensorGeometryTransformer

TMC2_CSV = Path("/Volumes/Ali/LUNAR-X_DATA/tmc2/ch2_tmc_ncn_20241221T0059555768_d_img_d18/geometry/calibrated/20241221/ch2_tmc_ncn_20241221T0059555768_g_grd_d18.csv")
OHRC_CSV = Path("/Users/liyakatali/Downloads/ch2_ohr_ncp_20260330T2317474369_d_img_d18/geometry/calibrated/20260330/ch2_ohr_ncp_20260330T2317474369_g_grd_d18.csv")


def test_tmc2_grid_loading():
    """Verify TMC-2 PDS4 geometry grid loading and tie-point structure."""
    grid = GroundCoordinateGrid(TMC2_CSV)
    assert grid.total_records == 161335
    assert len(grid.scans) == 3935
    assert len(grid.pixels) == 41
    assert grid.scans[0] == 0
    assert grid.scans[-1] == 393330
    assert grid.pixels[0] == 0
    assert grid.pixels[-1] == 3999


def test_ohrc_grid_loading():
    """Verify OHRC PDS4 geometry grid loading and tie-point structure."""
    grid = GroundCoordinateGrid(OHRC_CSV)
    assert grid.total_records == 111441
    assert len(grid.scans) == 921
    assert len(grid.pixels) == 121
    assert grid.scans[0] == 0
    assert grid.scans[-1] == 91970
    assert grid.pixels[0] == 0
    assert grid.pixels[-1] == 11999


def test_forward_inverse_consistency_ohrc():
    """Verify forward (line, sample) -> (lat, lon) and inverse mapping consistency."""
    grid = GroundCoordinateGrid(OHRC_CSV)
    test_line, test_sample = 45000.0, 4000.0
    lat, lon = grid.pixel_to_geo(test_line, test_sample)
    
    # Inverse mapping
    inv_line, inv_sample, res = grid.geo_to_pixel(lat, lon)
    assert inv_line is not None
    assert inv_sample is not None
    assert abs(inv_line - test_line) < 0.1
    assert abs(inv_sample - test_sample) < 0.1
    assert res < 1e-6


def test_cross_sensor_ohrc_inside_tmc2():
    """Verify all 4 OHRC corners fall inside the TMC-2 raster bounds."""
    transformer = CrossSensorGeometryTransformer(OHRC_CSV, TMC2_CSV)
    
    corners = [(0, 0), (0, 11999), (91970, 0), (91970, 11999)]
    for l, s in corners:
        tmc_l, tmc_s, lat, lon = transformer.ohrc_to_tmc2(l, s)
        assert tmc_l is not None
        assert tmc_s is not None
        # Must be inside TMC-2 full raster bounds: lines [0, 393330], samples [0, 3999]
        assert 0 <= tmc_l <= 393330
        assert 0 <= tmc_s <= 3999
        # Check that latitude is within equatorial lunar region
        assert 7.0 <= lat <= 7.9
        assert 301.1 <= lon <= 301.4


def test_missing_grid_file_handling(tmp_path):
    """Verify graceful handling when grid file does not exist."""
    fake_path = tmp_path / "non_existent.csv"
    with pytest.raises(FileNotFoundError):
        GroundCoordinateGrid(fake_path)
