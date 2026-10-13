"""
Tests for Document and Paper Sheet Detector.
"""

from pathlib import Path
import cv2
import pytest

from src.config import ProctorConfig
from src.document_detector import DocumentDetector


def test_document_detector_finds_paper():
    image_path = Path("sample_data/cheat_sheet_desk.jpg")
    assert image_path.exists(), "Sample test image must exist"

    image = cv2.imread(str(image_path))
    assert image is not None

    detector = DocumentDetector()
    results = detector.detect(image)

    # Must detect at least one document
    assert len(results) >= 1
    doc = results[0]

    # Verify quad corners
    assert doc.corners.shape == (4, 2)
    assert doc.confidence > 0.3
    assert doc.brightness > 100
    assert doc.warped_document is not None
    assert doc.warped_document.shape[0] > 50
    assert doc.warped_document.shape[1] > 50


def test_document_detector_blank_image():
    # Empty black image should detect no documents
    import numpy as np
    blank = np.zeros((480, 640, 3), dtype=np.uint8)
    detector = DocumentDetector()
    results = detector.detect(blank)
    assert len(results) == 0


def test_document_detector_magazine_cover():
    image_path = Path("sample_data/unauthorized_magazine_cover.jpg")
    assert image_path.exists(), "Magazine cover sample must exist"

    image = cv2.imread(str(image_path))
    assert image is not None

    detector = DocumentDetector()
    results = detector.detect(image)

    assert len(results) >= 1
    doc = results[0]
    assert doc.is_magazine is True
    assert "Magazine" in doc.label
    assert doc.color_richness > 50.0
    assert doc.confidence > 0.5

