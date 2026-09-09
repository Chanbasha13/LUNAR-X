"""
PDS4 XML Label Reader for Chandrayaan-2 OHRC products.

Parses a PDS4 XML label and extracts all available metadata.
Does NOT invent missing fields — returns 'AWAITING ANALYSIS' for anything
that cannot be determined from the XML.
"""

from __future__ import annotations

import os
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Optional

from app.models.schemas import (
    AnalysisStatus,
    ImageDimensions,
    PDS4Metadata,
)

# PDS4 / ISDA XML namespaces used by Chandrayaan-2 products
NAMESPACES = {
    "pds": "http://pds.nasa.gov/pds4/pds/v1",
    "disp": "http://pds.nasa.gov/pds4/disp/v1",
    "isda": "https://isda.issdc.gov.in/pds4/isda/v1",
    "sp": "http://pds.nasa.gov/pds4/sp/v1",
}


def _find_text(root: ET.Element, xpath: str, default: str = "AWAITING ANALYSIS") -> str:
    """Find text of a single element by XPath with namespace support."""
    el = root.find(xpath, NAMESPACES)
    if el is not None and el.text is not None:
        return el.text.strip()
    return default


def _find_float(root: ET.Element, xpath: str) -> Optional[float]:
    """Find and parse a float value, returning None if missing."""
    text = _find_text(root, xpath, default="")
    if text:
        try:
            return float(text)
        except ValueError:
            return None
    return None


def _find_int(root: ET.Element, xpath: str) -> Optional[int]:
    """Find and parse an int value, returning None if missing."""
    text = _find_text(root, xpath, default="")
    if text:
        try:
            return int(text)
        except ValueError:
            return None
    return None


def parse_pds4_label(xml_path: str) -> PDS4Metadata:
    """
    Parse a PDS4 XML label file and return structured metadata.

    Parameters
    ----------
    xml_path : str
        Absolute path to the PDS4 .xml label file.

    Returns
    -------
    PDS4Metadata
        Populated metadata with real values where available,
        'AWAITING ANALYSIS' for anything not found.
    """
    xml_path = str(Path(xml_path).resolve())

    if not os.path.isfile(xml_path):
        raise FileNotFoundError(f"PDS4 XML label not found: {xml_path}")

    tree = ET.parse(xml_path)
    root = tree.getroot()

    meta = PDS4Metadata()

    # --- Identification ---
    meta.product_id = _find_text(root, ".//pds:Identification_Area/pds:logical_identifier")
    meta.title = _find_text(root, ".//pds:Identification_Area/pds:title")

    # --- Investigation / Mission ---
    meta.mission = _find_text(root, ".//pds:Investigation_Area/pds:name")

    # --- Observing System ---
    for comp in root.findall(".//pds:Observing_System_Component", NAMESPACES):
        comp_type = _find_text(comp, "pds:type", "")
        comp_name = _find_text(comp, "pds:name", "")
        if comp_type == "Spacecraft":
            meta.spacecraft = comp_name
        elif comp_type == "Instrument":
            meta.instrument_name = comp_name
            meta.instrument_type = comp_type

    # --- Target ---
    meta.target = _find_text(root, ".//pds:Target_Identification/pds:name")

    # --- Processing level ---
    meta.processing_level = _find_text(
        root, ".//pds:Primary_Result_Summary/pds:processing_level"
    )

    # --- Time ---
    meta.start_time = _find_text(root, ".//pds:Time_Coordinates/pds:start_date_time")
    meta.stop_time = _find_text(root, ".//pds:Time_Coordinates/pds:stop_date_time")

    # --- File info ---
    meta.img_filename = _find_text(root, ".//pds:File_Area_Observational/pds:File/pds:file_name")
    meta.file_size_bytes = _find_int(root, ".//pds:File_Area_Observational/pds:File/pds:file_size")
    meta.md5_checksum = _find_text(root, ".//pds:File_Area_Observational/pds:File/pds:md5_checksum")

    # --- Array_2D_Image structure ---
    array_el = root.find(".//pds:Array_2D_Image", NAMESPACES)
    if array_el is not None:
        meta.offset_bytes = _find_int(array_el, "pds:offset") or 0
        meta.axis_index_order = _find_text(array_el, "pds:axis_index_order")

        # Data type
        meta.data_type = _find_text(array_el, "pds:Element_Array/pds:data_type")

        # Byte order — only relevant for multi-byte types
        byte_order_text = _find_text(
            array_el, "pds:Element_Array/pds:byte_order", default=""
        )
        if byte_order_text:
            meta.byte_order = byte_order_text
        elif meta.data_type in ("UnsignedByte", "SignedByte"):
            meta.byte_order = "N/A (single-byte type)"
        else:
            meta.byte_order = "AWAITING ANALYSIS"

        # Axes
        dims = ImageDimensions()
        for axis in array_el.findall("pds:Axis_Array", NAMESPACES):
            axis_name = _find_text(axis, "pds:axis_name", "")
            elements = _find_int(axis, "pds:elements")
            if axis_name == "Line":
                dims.lines = elements
            elif axis_name == "Sample":
                dims.samples = elements
            elif axis_name == "Band":
                dims.bands = elements or 1
        meta.dimensions = dims
    else:
        # Check for Array_3D_Image or other structures
        array3d = root.find(".//pds:Array_3D_Image", NAMESPACES)
        if array3d is not None:
            meta.offset_bytes = _find_int(array3d, "pds:offset") or 0
            meta.axis_index_order = _find_text(array3d, "pds:axis_index_order")
            meta.data_type = _find_text(array3d, "pds:Element_Array/pds:data_type")
            dims = ImageDimensions()
            for axis in array3d.findall("pds:Axis_Array", NAMESPACES):
                axis_name = _find_text(axis, "pds:axis_name", "")
                elements = _find_int(axis, "pds:elements")
                if axis_name == "Line":
                    dims.lines = elements
                elif axis_name == "Sample":
                    dims.samples = elements
                elif axis_name == "Band":
                    dims.bands = elements or 1
            meta.dimensions = dims

    # --- ISDA Mission-specific parameters ---
    pp = ".//isda:Product_Parameters"
    meta.orbit_number = _find_int(root, f"{pp}/isda:imaging_orbit_number")
    meta.pixel_resolution_m = _find_float(root, f"{pp}/isda:pixel_resolution")
    meta.solar_incidence_deg = _find_float(root, f"{pp}/isda:solar_incidence")
    meta.sun_azimuth_deg = _find_float(root, f"{pp}/isda:sun_azimuth")
    meta.sun_elevation_deg = _find_float(root, f"{pp}/isda:sun_elevation")
    meta.spacecraft_altitude_km = _find_float(root, f"{pp}/isda:spacecraft_altitude")
    meta.line_exposure_ms = _find_float(root, f"{pp}/isda:line_exposure_duration")
    meta.focal_length_mm = _find_float(root, f"{pp}/isda:focal_length")
    meta.tdi_stages = _find_text(root, f"{pp}/isda:tdi_stages")
    meta.projection = _find_text(root, f"{pp}/isda:projection")
    meta.area = _find_text(root, f"{pp}/isda:area")

    # --- Geometry corners (System_Level_Coordinates) ---
    gc = ".//isda:Geometry_Parameters/isda:System_Level_Coordinates"
    meta.upper_left_lat = _find_float(root, f"{gc}/isda:upper_left_latitude")
    meta.upper_left_lon = _find_float(root, f"{gc}/isda:upper_left_longitude")
    meta.upper_right_lat = _find_float(root, f"{gc}/isda:upper_right_latitude")
    meta.upper_right_lon = _find_float(root, f"{gc}/isda:upper_right_longitude")
    meta.lower_left_lat = _find_float(root, f"{gc}/isda:lower_left_latitude")
    meta.lower_left_lon = _find_float(root, f"{gc}/isda:lower_left_longitude")
    meta.lower_right_lat = _find_float(root, f"{gc}/isda:lower_right_latitude")
    meta.lower_right_lon = _find_float(root, f"{gc}/isda:lower_right_longitude")

    # --- Scaling / offset (Element_Array level, if present) ---
    meta.scaling_factor = _find_float(
        root, ".//pds:Element_Array/pds:scaling_factor"
    )
    meta.offset_value = _find_float(
        root, ".//pds:Element_Array/pds:value_offset"
    )

    # --- Validate file size ---
    _validate_file_size(meta, xml_path)

    # Mark as successfully parsed
    meta.status = AnalysisStatus.REFERENCE

    return meta


def _validate_file_size(meta: PDS4Metadata, xml_path: str) -> None:
    """
    Check that the IMG file size matches what the metadata says it should be.
    """
    if (
        meta.dimensions.lines is not None
        and meta.dimensions.samples is not None
        and meta.data_type != "AWAITING ANALYSIS"
    ):
        # Determine bytes per element from PDS4 data_type
        dtype_sizes = {
            "UnsignedByte": 1,
            "SignedByte": 1,
            "UnsignedLSB2": 2,
            "SignedLSB2": 2,
            "UnsignedMSB2": 2,
            "SignedMSB2": 2,
            "UnsignedLSB4": 4,
            "SignedLSB4": 4,
            "UnsignedMSB4": 4,
            "SignedMSB4": 4,
            "IEEE754LSBSingle": 4,
            "IEEE754MSBSingle": 4,
            "IEEE754LSBDouble": 8,
            "IEEE754MSBDouble": 8,
        }
        bpe = dtype_sizes.get(meta.data_type)
        if bpe is not None:
            expected = (
                meta.offset_bytes
                + meta.dimensions.lines
                * meta.dimensions.samples
                * meta.dimensions.bands
                * bpe
            )
            meta.expected_size_bytes = expected

            # Check actual file on disk
            xml_dir = os.path.dirname(xml_path)
            img_path = os.path.join(xml_dir, meta.img_filename)
            if os.path.isfile(img_path):
                actual = os.path.getsize(img_path)
                meta.file_size_valid = actual == expected
            else:
                meta.file_size_valid = None  # IMG file not found at expected path
