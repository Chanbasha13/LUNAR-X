"""
Geometry Mapper Service for Chandrayaan-2 Planetary Data Products.

Implements bi-directional mapping between raster pixel coordinates (Line, Sample)
and Selenographic coordinates (Latitude, Longitude) using the official ISDA
PDS4 Ground Coordinate Grid tie points (g_grd_d18.csv).
"""

from __future__ import annotations

import csv
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Union
import numpy as np


class GroundCoordinateGrid:
    """
    Structured 2D regular tie-point grid parsed from official PDS4 g_grd_d18.csv.
    """

    def __init__(self, csv_path: Union[str, Path]):
        self.csv_path = Path(csv_path).resolve()
        if not self.csv_path.is_file():
            raise FileNotFoundError(f"Geometry grid CSV not found: {self.csv_path}")

        self.scans: np.ndarray = np.array([])
        self.pixels: np.ndarray = np.array([])
        self.lat_grid: np.ndarray = np.ndarray([])
        self.lon_grid: np.ndarray = np.ndarray([])
        self.total_records: int = 0
        self._load_grid()

    def _load_grid(self) -> None:
        rows: List[List[float]] = []
        with open(self.csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader)  # ['Longitude', 'Latitude', 'Pixel', 'Scan']
            for r in reader:
                if len(r) == 4:
                    rows.append([float(r[0]), float(r[1]), int(r[2]), int(r[3])])

        self.total_records = len(rows)
        data = np.array(rows, dtype=np.float64)

        self.scans = np.unique(data[:, 3].astype(int))
        self.pixels = np.unique(data[:, 2].astype(int))

        n_scans = len(self.scans)
        n_pixels = len(self.pixels)

        if n_scans * n_pixels != self.total_records:
            raise ValueError(
                f"Grid dimensions mismatch: {n_scans} scans x {n_pixels} pixels != {self.total_records} records"
            )

        self.lon_grid = data[:, 0].reshape(n_scans, n_pixels)
        self.lat_grid = data[:, 1].reshape(n_scans, n_pixels)

    @property
    def lat_bounds(self) -> Tuple[float, float]:
        return float(self.lat_grid.min()), float(self.lat_grid.max())

    @property
    def lon_bounds(self) -> Tuple[float, float]:
        return float(self.lon_grid.min()), float(self.lon_grid.max())

    def pixel_to_geo(self, line: float, sample: float) -> Tuple[float, float]:
        """
        Forward mapping: (Line, Sample) -> (Latitude, Longitude) via bilinear interpolation.
        """
        line_clamped = np.clip(line, self.scans[0], self.scans[-1])
        sample_clamped = np.clip(sample, self.pixels[0], self.pixels[-1])

        i = int(np.clip(np.searchsorted(self.scans, line_clamped), 1, len(self.scans) - 1))
        j = int(np.clip(np.searchsorted(self.pixels, sample_clamped), 1, len(self.pixels) - 1))

        s0, s1 = self.scans[i - 1], self.scans[i]
        p0, p1 = self.pixels[j - 1], self.pixels[j]

        u = (line_clamped - s0) / (s1 - s0)
        v = (sample_clamped - p0) / (p1 - p0)

        lat = (
            (1 - u) * (1 - v) * self.lat_grid[i - 1, j - 1]
            + (1 - u) * v * self.lat_grid[i - 1, j]
            + u * (1 - v) * self.lat_grid[i, j - 1]
            + u * v * self.lat_grid[i, j]
        )

        lon = (
            (1 - u) * (1 - v) * self.lon_grid[i - 1, j - 1]
            + (1 - u) * v * self.lon_grid[i - 1, j]
            + u * (1 - v) * self.lon_grid[i, j - 1]
            + u * v * self.lon_grid[i, j]
        )

        return float(lat), float(lon)

    def geo_to_pixel(
        self, target_lat: float, target_lon: float, max_iter: int = 10
    ) -> Tuple[Optional[float], Optional[float], float]:
        """
        Inverse mapping: (Latitude, Longitude) -> (Line, Sample, Residual).
        Uses grid cell localization and Newton-Raphson iteration.
        """
        col0_lats = self.lat_grid[:, 0]
        if col0_lats[0] <= col0_lats[-1]:
            row_idx = int(np.searchsorted(col0_lats, target_lat))
        else:
            row_idx = int(np.searchsorted(-col0_lats, -target_lat))

        r_start = max(0, row_idx - 35)
        r_end = min(len(self.scans) - 1, row_idx + 35)

        best_dist = float("inf")
        best_line: Optional[float] = None
        best_sample: Optional[float] = None

        for i in range(r_start, r_end):
            for j in range(len(self.pixels) - 1):
                lats_c = np.array([
                    self.lat_grid[i, j],
                    self.lat_grid[i, j + 1],
                    self.lat_grid[i + 1, j + 1],
                    self.lat_grid[i + 1, j],
                ])
                lons_c = np.array([
                    self.lon_grid[i, j],
                    self.lon_grid[i, j + 1],
                    self.lon_grid[i + 1, j + 1],
                    self.lon_grid[i + 1, j],
                ])

                if (
                    min(lats_c) - 0.02 <= target_lat <= max(lats_c) + 0.02
                    and min(lons_c) - 0.02 <= target_lon <= max(lons_c) + 0.02
                ):
                    u, v = 0.5, 0.5
                    for _ in range(max_iter):
                        curr_lat = (
                            (1 - u) * (1 - v) * lats_c[0]
                            + (1 - u) * v * lats_c[1]
                            + u * (1 - v) * lats_c[3]
                            + u * v * lats_c[2]
                        )
                        curr_lon = (
                            (1 - u) * (1 - v) * lons_c[0]
                            + (1 - u) * v * lons_c[1]
                            + u * (1 - v) * lons_c[3]
                            + u * v * lons_c[2]
                        )

                        d_lat = target_lat - curr_lat
                        d_lon = target_lon - curr_lon

                        dlat_du = -(1 - v) * lats_c[0] - v * lats_c[1] + (1 - v) * lats_c[3] + v * lats_c[2]
                        dlat_dv = -(1 - u) * lats_c[0] + (1 - u) * lats_c[1] - u * lats_c[3] + u * lats_c[2]
                        dlon_du = -(1 - v) * lons_c[0] - v * lons_c[1] + (1 - v) * lons_c[3] + v * lons_c[2]
                        dlon_dv = -(1 - u) * lons_c[0] + (1 - u) * lons_c[1] - u * lons_c[3] + u * lons_c[2]

                        J = np.array([[dlat_du, dlat_dv], [dlon_du, dlon_dv]])
                        try:
                            delta = np.linalg.solve(J, np.array([d_lat, d_lon]))
                            u += float(delta[0])
                            v += float(delta[1])
                        except np.linalg.LinAlgError:
                            break

                    if -0.2 <= u <= 1.2 and -0.2 <= v <= 1.2:
                        curr_lat = (
                            (1 - u) * (1 - v) * lats_c[0]
                            + (1 - u) * v * lats_c[1]
                            + u * (1 - v) * lats_c[3]
                            + u * v * lats_c[2]
                        )
                        curr_lon = (
                            (1 - u) * (1 - v) * lons_c[0]
                            + (1 - u) * v * lons_c[1]
                            + u * (1 - v) * lons_c[3]
                            + u * v * lons_c[2]
                        )
                        err = float(np.hypot(curr_lat - target_lat, curr_lon - target_lon))
                        if err < best_dist:
                            best_dist = err
                            best_line = float(self.scans[i] + u * (self.scans[i + 1] - self.scans[i]))
                            best_sample = float(self.pixels[j] + v * (self.pixels[j + 1] - self.pixels[j]))

        return best_line, best_sample, best_dist


class CrossSensorGeometryTransformer:
    """
    Transforms pixel coordinates between OHRC and TMC-2 products.
    """

    def __init__(self, ohrc_csv_path: Union[str, Path], tmc2_csv_path: Union[str, Path]):
        self.ohrc_grid = GroundCoordinateGrid(ohrc_csv_path)
        self.tmc2_grid = GroundCoordinateGrid(tmc2_csv_path)

    def ohrc_to_tmc2(
        self, ohrc_line: float, ohrc_sample: float
    ) -> Tuple[Optional[float], Optional[float], float, float]:
        """
        Map OHRC (Line, Sample) -> TMC-2 (Line, Sample, Lat, Lon).
        """
        lat, lon = self.ohrc_grid.pixel_to_geo(ohrc_line, ohrc_sample)
        tmc_line, tmc_sample, _ = self.tmc2_grid.geo_to_pixel(lat, lon)
        return tmc_line, tmc_sample, lat, lon

    def tmc2_to_ohrc(
        self, tmc_line: float, tmc_sample: float
    ) -> Tuple[Optional[float], Optional[float], float, float]:
        """
        Map TMC-2 (Line, Sample) -> OHRC (Line, Sample, Lat, Lon).
        """
        lat, lon = self.tmc2_grid.pixel_to_geo(tmc_line, tmc_sample)
        ohrc_line, ohrc_sample, _ = self.ohrc_grid.geo_to_pixel(lat, lon)
        return ohrc_line, ohrc_sample, lat, lon
